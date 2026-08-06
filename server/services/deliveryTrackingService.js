import { config } from "../config/index.js";
import { withTransaction } from "../db/connection.js";
import { DatabaseSchemaError } from "../db/errors.js";
import { createDeliveryTracking } from "../integrations/deliveryTrackingProvider.js";
import {
  createOrderDeliveryTracking,
  findOrderDeliveryTracking,
  listCustomerOrderProgress,
  listDueDeliveries,
  listUntrackedDeliveries,
  markDeliveryTrackingArrived,
} from "../models/deliveryTrackingModel.js";
import {
  addOrderHistory,
  findOrderByPublicId,
  setOrderStatus,
} from "../models/orderModel.js";
import { writeAudit } from "../models/auditModel.js";
import { AppError } from "../utils/AppError.js";
import { paginated, paginationFrom } from "../utils/pagination.js";

function isMissingTrackingMigration(error) {
  return error instanceof DatabaseSchemaError;
}


export async function startTrackingForOrder(order, executor) {
  if (order.fulfillment_type !== "delivery") return null;
  const existing = await findOrderDeliveryTracking(order.id, executor, true);
  if (existing) return existing;
  const tracking = createDeliveryTracking();
  await createOrderDeliveryTracking({ orderId: order.id, ...tracking }, executor);
  return findOrderDeliveryTracking(order.id, executor, true);
}

async function initializeUntrackedDeliveries() {
  const untracked = await listUntrackedDeliveries();
  let initialized = 0;
  for (const item of untracked) {
    const created = await withTransaction(async (executor) => {
      const order = await findOrderByPublicId(item.public_id, executor, true);
      if (!order || order.status !== "out_for_delivery") return false;
      if (await findOrderDeliveryTracking(order.id, executor, true)) return false;
      await startTrackingForOrder(order, executor);
      return true;
    });
    if (created) initialized += 1;
  }
  return initialized;
}

async function reconcileDelivery(publicId) {
  const arrived = await withTransaction(async (executor) => {
    const order = await findOrderByPublicId(publicId, executor, true);
    if (!order || order.status !== "out_for_delivery") return false;
    const tracking = await findOrderDeliveryTracking(order.id, executor, true);
    if (!tracking || tracking.status !== "in_transit") return false;
    if (!(await markDeliveryTrackingArrived(tracking.id, executor))) return false;
    await setOrderStatus(order.id, "arrived", executor);
    await addOrderHistory({
      orderId: order.id,
      fromStatus: "out_for_delivery",
      toStatus: "arrived",
      note: "Delivery arrived at the customer pickup point",
    }, executor);
    return true;
  });
  if (!arrived) return false;
  await writeAudit({
    action: "order.delivery_arrived",
    resourceType: "order",
    resourcePublicId: publicId,
    summary: "Delivery tracking reported arrival",
  });
  return true;
}

async function performReconciliation() {
  const initialized = await initializeUntrackedDeliveries();
  const due = await listDueDeliveries();
  let arrived = 0;
  for (const item of due) {
    if (await reconcileDelivery(item.public_id)) arrived += 1;
  }
  return { initialized, arrived };
}

let reconciliationPromise = null;

export function reconcileDeliveryTracking() {
  if (!reconciliationPromise) {
    reconciliationPromise = performReconciliation()
      .finally(() => {
        reconciliationPromise = null;
      });
  }
  return reconciliationPromise;
}

export async function customerOrderProgress(user, query) {
  const paging = paginationFrom(query);
  let orders;
  try {
    await reconcileDeliveryTracking();
    orders = await listCustomerOrderProgress(user.id, paging);
  } catch (error) {
    if (isMissingTrackingMigration(error)) {
      throw new AppError(
        503,
        "DATABASE_MIGRATION_REQUIRED",
        `Delivery tracking is not installed in database ${config.db.database}. Run the delivery-tracking migration as a database administrator.`,
      );
    }
    throw error;
  }
  const now = Date.now();
  const publicOrders = orders.map((order) => {
    const startedAt = order.tracking_started_at
      ? new Date(order.tracking_started_at).getTime()
      : null;
    const etaAt = order.tracking_eta_at ? new Date(order.tracking_eta_at).getTime() : null;
    const duration = startedAt !== null && etaAt !== null ? etaAt - startedAt : 0;
    const progressPercent = duration > 0
      ? Math.max(0, Math.min(100, Math.round(((now - startedAt) / duration) * 100)))
      : null;
    return {
      publicId: order.public_id,
      orderNumber: order.order_number,
      vendorName: order.vendor_name,
      vendorSlug: order.vendor_slug,
      fulfillmentType: order.fulfillment_type,
      status: order.status,
      pickupCode: order.pickup_code,
      createdAt: order.created_at,
      updatedAt: order.updated_at,
      canConfirm: (order.fulfillment_type === "delivery" && order.status === "arrived")
        || (order.fulfillment_type === "pickup" && order.status === "ready"),
      tracking: order.tracking_provider ? {
        provider: order.tracking_provider,
        status: order.tracking_status,
        startedAt: order.tracking_started_at,
        etaAt: order.tracking_eta_at,
        arrivedAt: order.tracking_arrived_at,
        progressPercent,
        remainingSeconds: etaAt === null
          ? null
          : Math.max(0, Math.ceil((etaAt - now) / 1000)),
      } : null,
    };
  });
  return paginated(publicOrders, paging.page, paging.limit);
}

export function startDeliveryTrackingTimer() {
  let running = false;
  let lastErrorLogAt = 0;
  let lastErrorCode = null;
  const timer = setInterval(async () => {
    if (running) return;
    running = true;
    try {
      await reconcileDeliveryTracking();
    } catch (error) {
      const now = Date.now();
      const errorCode = error.code ?? "DELIVERY_TRACKING_FAILED";
      if (errorCode !== lastErrorCode || now - lastErrorLogAt >= 60_000) {
        console.error(JSON.stringify({
          level: "error",
          message: isMissingTrackingMigration(error)
            ? `Delivery tracking migration is required for database ${config.db.database}`
            : "Delivery tracking reconciliation failed",
          errorCode,
          errorName: error.name ?? "Error",
        }));
        lastErrorCode = errorCode;
        lastErrorLogAt = now;
      }
    } finally {
      running = false;
    }
  }, config.deliveryTracking.reconcileIntervalMs);
  timer.unref();
  return timer;
}
