import { withTransaction } from "../db/connection.js";
import { writeAudit } from "../models/auditModel.js";
import {
  addOrderHistory,
  createOrderCancellationRequest,
  findOpenOrderCancellation,
  findOrderByPublicId,
  findPaymentForOrder,
  listAdminOrders,
  listCustomerOrders,
  listOrderHistoriesByOrderIds,
  listOrderHistory,
  listOrderItems,
  listVendorOrders,
  restoreOrderStock,
  setOrderStatus,
} from "../models/orderModel.js";
import { AppError, conflict, forbidden, notFound } from "../utils/AppError.js";
import { publicId } from "../utils/identifiers.js";
import { paginated, paginationFrom } from "../utils/pagination.js";
import { canTransition, orderTransitions } from "../utils/statusRules.js";
import {
  customerOrderProgress,
  startTrackingForOrder,
} from "./deliveryTrackingService.js";
import { orderEmailEvents, sendOrderEmail } from "./orderEmailService.js";
import { requireMembership } from "./partnerService.js";

function canReadOrder(user, order, membership) {
  return user.role === "admin"
    || order.user_id === user.id
    || (membership && membership.vendor_id === order.vendor_id);
}

export async function orderDetails(user, orderPublicId) {
  const order = await findOrderByPublicId(orderPublicId);
  if (!order) throw notFound("Order not found");
  const membership = user.role === "vendor_manager"
    ? await requireMembership(user.id)
    : null;
  if (!canReadOrder(user, order, membership)) throw forbidden();
  const [items, history, payment, cancellation] = await Promise.all([
    listOrderItems(order.id),
    listOrderHistory(order.id),
    findPaymentForOrder(order.id),
    findOpenOrderCancellation(order.id),
  ]);
  delete order.id;
  delete order.user_id;
  delete order.vendor_id;
  return {
    ...order,
    items,
    history,
    payment: payment
      ? {
        status: payment.status,
        amountAgorot: payment.amount_agorot,
        currency: payment.currency,
      }
      : null,
    cancellationRequest: cancellation,
  };
}

export async function customerOrders(user, query) {
  const paging = paginationFrom(query);
  const rows = await listCustomerOrders(user.id, { ...paging, ...query });
  return paginated(rows, paging.page, paging.limit);
}

export async function customerProgress(user, query) {
  return customerOrderProgress(user, query);
}

export async function partnerOrders(user, query) {
  const membership = await requireMembership(user.id);
  const paging = paginationFrom(query);
  const rows = await listVendorOrders(membership.vendor_id, { ...paging, ...query });
  return paginated(rows, paging.page, paging.limit);
}

export async function adminOrderLogs(query) {
  const paging = paginationFrom(query);
  const rows = await listAdminOrders({ ...paging, ...query });
  const histories = await listOrderHistoriesByOrderIds(rows.map((order) => order.id));
  const historyByOrder = new Map();
  for (const event of histories) {
    const events = historyByOrder.get(event.order_id) ?? [];
    const publicEvent = { ...event };
    delete publicEvent.order_id;
    events.push(publicEvent);
    historyByOrder.set(event.order_id, events);
  }
  const result = rows.map((order) => {
    const history = historyByOrder.get(order.id) ?? [];
    const publicOrder = { ...order };
    delete publicOrder.id;
    return { ...publicOrder, history };
  });
  return paginated(result, paging.page, paging.limit);
}

export async function updatePartnerOrder(user, publicIdValue, input, context) {
  const membership = await requireMembership(user.id);
  const updated = await withTransaction(async (connection) => {
    const order = await findOrderByPublicId(publicIdValue, connection, true);
    if (!order || order.vendor_id !== membership.vendor_id) throw notFound("Order not found");
    if (!canTransition(orderTransitions, order.status, input.status)) {
      throw conflict(`Cannot move an order from ${order.status} to ${input.status}`, "INVALID_STATUS_TRANSITION");
    }
    if (input.status === "out_for_delivery" && order.fulfillment_type !== "delivery") {
      throw new AppError(400, "PICKUP_ORDER", "Pickup orders cannot be sent for delivery");
    }
    if (input.status === "ready" && order.fulfillment_type !== "pickup") {
      throw new AppError(400, "DELIVERY_ORDER", "Delivery orders must be marked as out for delivery");
    }
    await setOrderStatus(order.id, input.status, connection);
    if (input.status === "out_for_delivery") {
      await startTrackingForOrder(order, connection);
    }
    await addOrderHistory({
      orderId: order.id,
      actorUserId: user.id,
      fromStatus: order.status,
      toStatus: input.status,
      note: input.note,
    }, connection);
    return order;
  });

  await writeAudit({
    actorUserId: user.id,
    action: "order.status_update",
    resourceType: "order",
    resourcePublicId: publicIdValue,
    summary: `${updated.status} -> ${input.status}`,
    requestId: context.requestId,
  });
  return orderDetails(user, publicIdValue);
}

export async function completeCustomerOrder(user, publicIdValue, context) {
  const result = await withTransaction(async (connection) => {
    const order = await findOrderByPublicId(publicIdValue, connection, true);
    if (!order) throw notFound("Order not found");
    if (order.user_id !== user.id) throw forbidden();
    if (order.status === "completed") return { alreadyCompleted: true };

    const confirmableStatus = order.fulfillment_type === "delivery"
      ? "arrived"
      : "ready";
    if (order.status !== confirmableStatus) {
      throw conflict(
        order.fulfillment_type === "delivery"
          ? "This delivery cannot be confirmed before it arrives"
          : "This pickup cannot be confirmed before it is ready",
        "ORDER_NOT_CONFIRMABLE",
      );
    }

    await setOrderStatus(order.id, "completed", connection);
    await addOrderHistory({
      orderId: order.id,
      actorUserId: user.id,
      fromStatus: order.status,
      toStatus: "completed",
      note: order.fulfillment_type === "delivery"
        ? "Customer confirmed delivery"
        : "Customer confirmed pickup",
    }, connection);
    return { alreadyCompleted: false };
  });

  if (!result.alreadyCompleted) {
    await writeAudit({
      actorUserId: user.id,
      action: "order.customer_complete",
      resourceType: "order",
      resourcePublicId: publicIdValue,
      requestId: context.requestId,
    });
    await sendOrderEmail(publicIdValue, orderEmailEvents.completed);
  }
  return orderDetails(user, publicIdValue);
}

export async function cancelOrRequestOrder(user, publicIdValue, input, context) {
  const result = await withTransaction(async (connection) => {
    const order = await findOrderByPublicId(publicIdValue, connection, true);
    if (!order) throw notFound("Order not found");
    if (order.user_id !== user.id) throw forbidden();
    if (order.status === "pending_payment") {
      await restoreOrderStock(order.id, connection);
      await setOrderStatus(order.id, "cancelled", connection);
      await addOrderHistory({
        orderId: order.id,
        actorUserId: user.id,
        fromStatus: order.status,
        toStatus: "cancelled",
        note: input.reason,
      }, connection);
      return "cancelled";
    }
    if (["placed"].includes(order.status)) {
      if (await findOpenOrderCancellation(order.id, connection)) {
        throw conflict("A cancellation request is already open", "CANCELLATION_EXISTS");
      }
      await createOrderCancellationRequest({
        publicId: publicId(),
        userId: user.id,
        orderId: order.id,
        reason: input.reason,
      }, connection);
      await setOrderStatus(order.id, "cancellation_requested", connection);
      await addOrderHistory({
        orderId: order.id,
        actorUserId: user.id,
        fromStatus: order.status,
        toStatus: "cancellation_requested",
        note: "Manual refund review required",
      }, connection);
      return "requested";
    }
    throw conflict("This order can no longer be cancelled online", "CANCELLATION_UNAVAILABLE");
  });

  await writeAudit({
    actorUserId: user.id,
    action: result === "cancelled" ? "order.cancel" : "order.cancellation_request",
    resourceType: "order",
    resourcePublicId: publicIdValue,
    requestId: context.requestId,
  });
  return orderDetails(user, publicIdValue);
}
