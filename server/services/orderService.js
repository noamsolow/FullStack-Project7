import { withTransaction } from "../db/connection.js";
import { config } from "../config/index.js";
import {
  addOrderHistory,
  attachProviderOrder,
  completeOrderPayment,
  createOrder,
  createOrderCancellationRequest,
  createOrderPayment,
  decrementStock,
  findExpiredReservations,
  findOpenOrderCancellation,
  findOrderByPublicId,
  findPaymentForOrder,
  insertOrderItems,
  listCustomerOrders,
  listAdminOrders,
  listOrderHistory,
  listOrderHistoriesByOrderIds,
  listOrderItems,
  listVendorOrders,
  lockProductsByPublicIds,
  markPaymentFailed,
  restoreOrderStock,
  setOrderStatus,
  setPaymentProcessing,
} from "../models/orderModel.js";
import { findDeliveryZone } from "../models/catalogModel.js";
import { debitTokens, findTokenBalance } from "../models/tokenModel.js";
import { writeAudit } from "../models/auditModel.js";
import {
  capturePayPalOrder,
  captureSummary,
  createPayPalOrder,
  getPayPalOrder,
} from "../integrations/paypalClient.js";
import { AppError, conflict, forbidden, notFound } from "../utils/AppError.js";
import {
  publicId,
  referenceNumber,
  shortCode,
} from "../utils/identifiers.js";
import { payPalToAgorot } from "../utils/money.js";
import { paginated, paginationFrom } from "../utils/pagination.js";
import { calculateDeliveryFeeAgorot } from "../utils/deliveryPricing.js";
import { canTransition, orderTransitions } from "../utils/statusRules.js";
import { orderEmailEvents, sendOrderEmail } from "./orderEmailService.js";
import {
  customerOrderProgress,
  startTrackingForOrder,
} from "./deliveryTrackingService.js";
import { requireMembership } from "./partnerService.js";

function normalizeItems(items) {
  const quantities = new Map();
  for (const item of items) {
    quantities.set(item.productId, (quantities.get(item.productId) ?? 0) + item.quantity);
  }
  return Array.from(quantities, ([productIdValue, quantity]) => ({
    productId: productIdValue,
    quantity,
  }));
}

async function createStoredOrder(user, input) {
  const requested = normalizeItems(input.items);
  const paypalPayment = input.paymentMethod === "paypal";
  if (requested.some((item) => item.quantity > 20)) {
    throw new AppError(400, "INVALID_QUANTITY", "No product may exceed 20 units");
  }
  if (requested.reduce((sum, item) => sum + item.quantity, 0) > 50) {
    throw new AppError(400, "CART_TOO_LARGE", "An order may contain at most 50 total units");
  }

  return withTransaction(async (connection) => {
    const startingTokenBalance = paypalPayment
      ? null
      : await findTokenBalance(user.id, connection, true);
    const products = await lockProductsByPublicIds(
      requested.map((item) => item.productId),
      connection,
    );
    if (products.length !== requested.length) {
      throw new AppError(400, "PRODUCT_UNAVAILABLE", "One or more products are unavailable");
    }
    const productMap = new Map(products.map((item) => [item.public_id, item]));
    const vendorIds = new Set(products.map((item) => item.vendor_id));
    if (vendorIds.size !== 1) {
      throw new AppError(400, "SINGLE_VENDOR_REQUIRED", "Place separate orders for different vendors");
    }

    const first = products[0];
    if (first.vendor_status !== "active" || first.vendor_deleted_at) {
      throw new AppError(409, "VENDOR_UNAVAILABLE", "This vendor is unavailable");
    }
    if (input.fulfillmentType === "pickup" && !first.pickup_enabled) {
      throw new AppError(400, "PICKUP_UNAVAILABLE", "This vendor does not offer pickup");
    }
    if (input.fulfillmentType === "delivery" && !first.delivery_enabled) {
      throw new AppError(400, "DELIVERY_UNAVAILABLE", "This vendor does not deliver");
    }
    if (first.vendor_type === "vending_machine" && input.fulfillmentType !== "pickup") {
      throw new AppError(400, "VENDING_PICKUP_ONLY", "Vending reservations are pickup only");
    }

    const preparedItems = requested.map((requestItem) => {
      const product = productMap.get(requestItem.productId);
      if (
        !product.is_available
        || product.deleted_at
        || (product.stock_quantity !== null && product.stock_quantity < requestItem.quantity)
      ) {
        throw new AppError(409, "PRODUCT_UNAVAILABLE", `${product.name} is no longer available`);
      }
      return {
        productId: product.id,
        publicId: product.public_id,
        name: product.name,
        sku: product.sku,
        priceAgorot: product.price_agorot,
        quantity: requestItem.quantity,
        lineTotalAgorot: product.price_agorot * requestItem.quantity,
        trackedStock: product.stock_quantity !== null,
      };
    });
    const subtotalAgorot = preparedItems.reduce(
      (sum, item) => sum + item.lineTotalAgorot,
      0,
    );

    let deliveryFeeAgorot = 0;
    let deliveryBuildingId = null;
    if (input.fulfillmentType === "delivery") {
      const zone = await findDeliveryZone(
        first.vendor_id,
        input.deliveryBuildingId,
        connection,
      );
      if (!zone) {
        throw new AppError(400, "DELIVERY_ZONE_UNAVAILABLE", "The vendor does not deliver there");
      }
      deliveryFeeAgorot = calculateDeliveryFeeAgorot(zone);
      deliveryBuildingId = zone.building_id;
    }

    const totalAgorot = subtotalAgorot + deliveryFeeAgorot;
    const tokenCost = Math.ceil(totalAgorot / 100);

    for (const item of preparedItems.filter((value) => value.trackedStock)) {
      if (!(await decrementStock(item.productId, item.quantity, connection))) {
        throw conflict(`${item.name} just went out of stock`, "OUT_OF_STOCK");
      }
    }

    const orderPublicId = publicId();
    const orderId = await createOrder({
      publicId: orderPublicId,
      orderNumber: referenceNumber("LG"),
      userId: user.id,
      vendorId: first.vendor_id,
      fulfillmentType: input.fulfillmentType,
      deliveryBuildingId,
      deliveryLocation: input.fulfillmentType === "delivery"
        ? input.deliveryLocation
        : null,
      subtotalAgorot,
      deliveryFeeAgorot,
      totalAgorot,
      paymentMethod: input.paymentMethod,
      status: paypalPayment ? "pending_payment" : "placed",
      pickupCode: shortCode(),
      reservationExpiresAt: paypalPayment
        ? new Date(Date.now() + 20 * 60 * 1000)
        : null,
    }, connection);
    await insertOrderItems(orderId, preparedItems, connection);
    const remainingTokens = paypalPayment
      ? null
      : await debitTokens({
        publicId: publicId(),
        userId: user.id,
        orderId,
        amountTokens: tokenCost,
        note: `Token payment for ${orderPublicId}`,
      }, connection);
    if (!paypalPayment && remainingTokens === null) {
      throw new AppError(
        409,
        "INSUFFICIENT_TOKENS",
        `This order needs ${tokenCost} tokens; your balance is ${startingTokenBalance ?? 0}`,
      );
    }
    await addOrderHistory({
      orderId,
      actorUserId: user.id,
      toStatus: paypalPayment ? "pending_payment" : "placed",
      note: paypalPayment
        ? "Stock reserved for 20 minutes"
        : `${tokenCost} LevGo tokens paid`,
    }, connection);
    const paymentId = paypalPayment
      ? await createOrderPayment({
        publicId: publicId(),
        orderId,
        amountAgorot: totalAgorot,
      }, connection)
      : null;

    return {
      orderId,
      orderPublicId,
      paymentId,
      amountAgorot: totalAgorot,
      vendorName: first.vendor_name,
      paymentMethod: input.paymentMethod,
      remainingTokens,
      tokensSpent: paypalPayment ? null : tokenCost,
    };
  });
}

async function compensateCheckout(order, code) {
  await withTransaction(async (connection) => {
    const locked = await findOrderByPublicId(order.orderPublicId, connection, true);
    if (locked?.status !== "pending_payment") return;
    await restoreOrderStock(locked.id, connection);
    await setOrderStatus(locked.id, "cancelled", connection);
    await markPaymentFailed(order.paymentId, code, connection);
    await addOrderHistory({
      orderId: locked.id,
      fromStatus: "pending_payment",
      toStatus: "cancelled",
      note: "Payment checkout could not be created",
    }, connection);
  });
}

export async function checkout(user, input, context) {
  if (input.paymentMethod === "paypal" && !config.paypal.enabled) {
    throw new AppError(503, "PAYMENTS_DISABLED", "PayPal checkout is currently unavailable");
  }
  if (input.paymentMethod === "tokens" && await findTokenBalance(user.id) === null) {
    throw new AppError(503, "TOKENS_NOT_CONFIGURED", "Token checkout is not configured yet");
  }
  const stored = await createStoredOrder(user, input);
  if (stored.paymentMethod === "tokens") {
    await writeAudit({
      actorUserId: user.id,
      action: "order.checkout_tokens",
      resourceType: "order",
      resourcePublicId: stored.orderPublicId,
      summary: `${stored.tokensSpent} tokens spent`,
      requestId: context.requestId,
    });
    await sendOrderEmail(stored.orderPublicId, orderEmailEvents.confirmed);
    return {
      orderPublicId: stored.orderPublicId,
      amountAgorot: stored.amountAgorot,
      currency: "ILS",
      status: "placed",
      paymentRequired: false,
      paymentMethod: "tokens",
      tokensSpent: stored.tokensSpent,
      remainingTokens: stored.remainingTokens,
    };
  }

  let paypal;
  try {
    paypal = await createPayPalOrder({
      referenceId: stored.orderPublicId,
      description: `LevGo order from ${stored.vendorName}`,
      amountAgorot: stored.amountAgorot,
    });
    await attachProviderOrder(stored.paymentId, paypal.providerOrderId);
  } catch (error) {
    await compensateCheckout(stored, error.code ?? "PAYMENT_CREATE_FAILED");
    throw error;
  }

  await writeAudit({
    actorUserId: user.id,
    action: "order.checkout",
    resourceType: "order",
    resourcePublicId: stored.orderPublicId,
    requestId: context.requestId,
  });

  return {
    orderPublicId: stored.orderPublicId,
    approvalUrl: paypal.approvalUrl,
    amountAgorot: stored.amountAgorot,
    currency: "ILS",
    reservationMinutes: 20,
    paymentRequired: true,
    paymentMethod: "paypal",
  };
}

export async function checkoutOptions(user) {
  const tokenBalance = await findTokenBalance(user.id);
  return {
    tokenBalance: tokenBalance ?? 0,
    tokensEnabled: tokenBalance !== null,
    tokenRate: { tokens: 1, currency: "ILS", amountAgorot: 100 },
    paypalEnabled: config.paypal.enabled,
  };
}

function verifyCaptured(summary, payment) {
  const amountAgorot = payPalToAgorot(summary.amountValue);
  if (
    summary.orderStatus !== "COMPLETED"
    || summary.captureStatus !== "COMPLETED"
    || !summary.providerCaptureId
    || summary.providerOrderId !== payment.provider_order_id
    || summary.currency !== payment.currency
    || amountAgorot !== payment.amount_agorot
  ) {
    throw new AppError(
      409,
      "PAYMENT_VERIFICATION_FAILED",
      "The captured payment does not match this order",
    );
  }
}

export async function captureOrderPayment(user, orderPublicId, input, context) {
  if (!config.paypal.enabled) {
    throw new AppError(409, "PAYMENTS_DISABLED", "Online payments are currently disabled");
  }
  const initial = await withTransaction(async (connection) => {
    const order = await findOrderByPublicId(orderPublicId, connection, true);
    if (!order) throw notFound("Order not found");
    if (order.user_id !== user.id) throw forbidden();
    const payment = await findPaymentForOrder(order.id, connection, true);
    if (!payment || payment.provider_order_id !== input.providerOrderId) {
      throw new AppError(400, "PAYMENT_MISMATCH", "Payment does not belong to this order");
    }
    if (payment.status === "completed" && order.status !== "pending_payment") {
      return { alreadyCompleted: true, order };
    }
    if (!["pending_payment", "payment_processing"].includes(order.status)) {
      throw conflict("This order can no longer be paid", "ORDER_NOT_PAYABLE");
    }
    if (
      order.reservation_expires_at
      && new Date(order.reservation_expires_at).getTime() < Date.now()
    ) {
      throw conflict("This checkout reservation expired", "RESERVATION_EXPIRED");
    }
    await setPaymentProcessing(payment.id, connection);
    await setOrderStatus(order.id, "payment_processing", connection);
    return { order, payment, alreadyCompleted: false };
  });

  if (initial.alreadyCompleted) return orderDetails(user, orderPublicId);

  let providerResponse = await getPayPalOrder(input.providerOrderId);
  if (providerResponse.status !== "COMPLETED") {
    providerResponse = await capturePayPalOrder(
      input.providerOrderId,
      orderPublicId,
    );
  }
  const summary = captureSummary(providerResponse);
  verifyCaptured(summary, initial.payment);

  await withTransaction(async (connection) => {
    const order = await findOrderByPublicId(orderPublicId, connection, true);
    const payment = await findPaymentForOrder(order.id, connection, true);
    if (payment.status === "completed") return;
    await completeOrderPayment({
      paymentId: payment.id,
      providerCaptureId: summary.providerCaptureId,
      orderId: order.id,
    }, connection);
    await addOrderHistory({
      orderId: order.id,
      actorUserId: user.id,
      fromStatus: order.status,
      toStatus: "placed",
      note: "PayPal payment captured",
    }, connection);
  });

  await writeAudit({
    actorUserId: user.id,
    action: "payment.capture",
    resourceType: "order",
    resourcePublicId: orderPublicId,
    requestId: context.requestId,
  });
  await sendOrderEmail(orderPublicId, orderEmailEvents.confirmed);
  return orderDetails(user, orderPublicId);
}

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

export async function expireReservations() {
  const expired = await findExpiredReservations();
  let cancelled = 0;
  for (const item of expired) {
    const didCancel = await withTransaction(async (connection) => {
      const order = await findOrderByPublicId(item.public_id, connection, true);
      if (
        !order
        || order.status !== "pending_payment"
        || new Date(order.reservation_expires_at).getTime() >= Date.now()
      ) return false;
      await restoreOrderStock(order.id, connection);
      await setOrderStatus(order.id, "cancelled", connection);
      await addOrderHistory({
        orderId: order.id,
        fromStatus: "pending_payment",
        toStatus: "cancelled",
        note: "Payment reservation expired",
      }, connection);
      return true;
    });
    if (didCancel) {
      cancelled += 1;
    }
  }
  return cancelled;
}
