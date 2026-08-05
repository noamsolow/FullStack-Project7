import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../features/auth/AuthContext.jsx";
import { usePolling } from "../../hooks/usePolling.js";
import { orderService } from "../../services/commerce/orderService.js";
import { orderStatusLabel } from "../../utils/format.js";
import { Icon } from "../ui/Icon.jsx";
import { StatusChip } from "../ui/StatusChip.jsx";

const visibleLimit = 3;
const arrivalSeenPrefix = "levgo:arrival-seen:";
const collapsedStorageKey = "levgo:order-progress-collapsed";

function progressFor(order, now) {
  if (order.status === "arrived" || order.status === "ready") return 100;
  if (order.status === "out_for_delivery" && order.tracking) {
    const started = new Date(order.tracking.startedAt).getTime();
    const eta = new Date(order.tracking.etaAt).getTime();
    if (eta > started) return Math.max(0, Math.min(99, ((now - started) / (eta - started)) * 100));
  }
  return {
    pending_payment: 5,
    payment_processing: 10,
    placed: 20,
    accepted: 30,
    preparing: 48,
    cancellation_requested: 60,
    needs_attention: 60,
  }[order.status] ?? 15;
}

function remainingSeconds(order, now) {
  if (!order.tracking?.etaAt || order.status !== "out_for_delivery") return null;
  return Math.max(0, Math.ceil((new Date(order.tracking.etaAt).getTime() - now) / 1000));
}

function ProgressOrder({ order, now, onOpen }) {
  const moving = order.status === "out_for_delivery";
  const ready = order.canConfirm;
  const remaining = remainingSeconds(order, now);
  const progress = progressFor(order, now);
  return (
    <article className={`order-progress-item${ready ? " order-progress-item--ready" : ""}`}>
      <div className="order-progress-item__heading">
        <div>
          <strong>{order.vendorName}</strong>
          <small>{order.orderNumber}</small>
        </div>
        <StatusChip status={order.status} />
      </div>
      <div
        className={`delivery-track${moving ? " delivery-track--moving" : ""}`}
        aria-label={`${orderStatusLabel(order.status)}: ${Math.round(progress)} percent`}
      >
        <span className="delivery-track__fill" style={{ width: `${progress}%` }} />
        <span className="delivery-track__marker" style={{ left: `${progress}%` }}>
          <Icon name={ready ? "check" : moving ? "route" : "clock"} size={15} />
        </span>
      </div>
      <div className="order-progress-item__footer">
        <span>
          {moving && remaining !== null
            ? `Arriving in about ${remaining}s`
            : ready
              ? order.fulfillmentType === "delivery" ? "Ready at your delivery point" : "Ready for pickup"
              : orderStatusLabel(order.status)}
        </span>
        <Link to={`/orders/${order.publicId}`} onClick={() => onOpen(order)}>
          {ready ? "View & accept" : "View order"} <Icon name="arrow" size={14} />
        </Link>
      </div>
    </article>
  );
}

export function CustomerOrderProgress() {
  const { user, checking } = useAuth();
  const isCustomer = !checking && user?.role === "customer";
  const [orders, setOrders] = useState([]);
  const [collapsed, setCollapsed] = useState(
    () => localStorage.getItem(collapsedStorageKey) === "true",
  );
  const [error, setError] = useState(false);
  const [pulse, setPulse] = useState(false);
  const [announcement, setAnnouncement] = useState("");
  const [now, setNow] = useState(Date.now());
  const [meta, setMeta] = useState({ page: 1, limit: visibleLimit, hasMore: false });
  const [loadingMore, setLoadingMore] = useState(false);
  const loading = useRef(false);
  const requestedLimit = useRef(visibleLimit);

  const load = useCallback(async (limit = requestedLimit.current) => {
    if (!isCustomer || loading.current) return false;
    loading.current = true;
    try {
      const response = await orderService.progress({ page: 1, limit });
      setOrders(response.data ?? []);
      setMeta(response.meta ?? { page: 1, limit, hasMore: false });
      setError(false);
      return true;
    } catch {
      setError(true);
      return false;
    } finally {
      loading.current = false;
    }
  }, [isCustomer]);

  useEffect(() => {
    if (!isCustomer) {
      setOrders([]);
      requestedLimit.current = visibleLimit;
      setMeta({ page: 1, limit: visibleLimit, hasMore: false });
      return;
    }
    load();
  }, [isCustomer, load]);

  useEffect(() => {
    const refresh = () => load();
    window.addEventListener("levgo:orders-changed", refresh);
    return () => window.removeEventListener("levgo:orders-changed", refresh);
  }, [load]);

  const hasMovingOrder = orders.some((order) => order.status === "out_for_delivery");
  usePolling(load, hasMovingOrder ? 2_000 : 10_000, isCustomer);

  useEffect(() => {
    if (!hasMovingOrder) return undefined;
    const timer = setInterval(() => setNow(Date.now()), 1_000);
    return () => clearInterval(timer);
  }, [hasMovingOrder]);

  useEffect(() => {
    const newArrivals = orders.filter((order) => {
      if (order.status !== "arrived") return false;
      return sessionStorage.getItem(`${arrivalSeenPrefix}${order.publicId}`) !== order.updatedAt;
    });
    if (!newArrivals.length) return undefined;
    newArrivals.forEach((order) => {
      sessionStorage.setItem(`${arrivalSeenPrefix}${order.publicId}`, order.updatedAt);
    });
    setAnnouncement(newArrivals.length === 1
      ? `${newArrivals[0].orderNumber} has arrived and is ready to collect.`
      : `${newArrivals.length} orders have arrived and are ready to collect.`);
    setPulse(true);
    const timer = setTimeout(() => setPulse(false), 4_500);
    return () => clearTimeout(timer);
  }, [orders]);

  function markOpened(order) {
    if (order.status === "arrived") {
      sessionStorage.setItem(`${arrivalSeenPrefix}${order.publicId}`, order.updatedAt);
    }
  }

  function toggleCollapsed() {
    setCollapsed((current) => {
      localStorage.setItem(collapsedStorageKey, String(!current));
      return !current;
    });
  }

  async function loadMoreOrders() {
    if (loading.current) return;
    const previousLimit = requestedLimit.current;
    const nextLimit = Math.min(previousLimit + visibleLimit, 50);
    requestedLimit.current = nextLimit;
    setLoadingMore(true);
    if (!(await load(nextLimit))) requestedLimit.current = previousLimit;
    setLoadingMore(false);
  }

  if (!isCustomer) return null;
  return (
    <aside className={`order-progress-panel${pulse ? " order-progress-panel--pulse" : ""}${collapsed ? " order-progress-panel--collapsed" : ""}`}>
      <p className="sr-only" aria-live="polite">{announcement}</p>
      <header className="order-progress-panel__header">
        <span className="order-progress-panel__icon"><Icon name="route" /></span>
        <div>
          <strong>My order progress</strong>
          <small>{orders.length ? `${orders.length}${meta.hasMore ? "+" : ""} active order${orders.length === 1 && !meta.hasMore ? "" : "s"}` : "No active orders"}</small>
        </div>
        {orders.some((order) => order.canConfirm) && (
          <span className="order-progress-panel__ready-count" aria-label="Orders ready">
            {orders.filter((order) => order.canConfirm).length}
          </span>
        )}
        <button
          type="button"
          className="order-progress-panel__collapse"
          aria-label={collapsed ? "Expand order progress" : "Collapse order progress"}
          aria-expanded={!collapsed}
          onClick={toggleCollapsed}
        >
          <Icon name="arrow" size={17} />
        </button>
      </header>
      {!collapsed && error && !orders.length && (
        <button type="button" className="order-progress-panel__retry" onClick={load}>Refresh order status</button>
      )}
      {!collapsed && <div className={`order-progress-panel__orders${orders.length > visibleLimit ? " is-expanded" : ""}`}>
        {orders.map((order) => (
          <ProgressOrder key={order.publicId} order={order} now={now} onOpen={markOpened} />
        ))}
      </div>}
      {!collapsed && meta.hasMore && requestedLimit.current < 50 && (
        <button
          type="button"
          className="order-progress-panel__expand"
          onClick={loadMoreOrders}
          disabled={loadingMore}
        >
          {loadingMore ? "Loading more..." : "See 3 more orders"}
        </button>
      )}
      {!collapsed && meta.hasMore && requestedLimit.current >= 50 && (
        <Link className="order-progress-panel__expand" to="/orders">Open the full orders list</Link>
      )}
    </aside>
  );
}
