import { useCallback, useState } from "react";
import { Icon } from "../../components/ui/Icon.jsx";
import { EmptyState, ErrorState, LoadingState } from "../../components/ui/PageState.jsx";
import { LoadMoreButton } from "../../components/ui/LoadMoreButton.jsx";
import { PageHeader } from "../../components/ui/PageHeader.jsx";
import { StatusChip } from "../../components/ui/StatusChip.jsx";
import { useApiResource } from "../../hooks/useApiResource.js";
import { useDebouncedValue } from "../../hooks/useDebouncedValue.js";
import { useLoadMoreResource } from "../../hooks/useLoadMoreResource.js";
import { adminService } from "../../services/portals/adminService.js";
import {
  formatDate,
  formatMoney,
  orderStatusLabel,
  titleCase,
} from "../../utils/format.js";

const statuses = [
  "placed",
  "preparing",
  "ready",
  "out_for_delivery",
  "completed",
  "cancelled",
  "cancellation_requested",
  "needs_attention",
];

function timelineStages(order) {
  return [
    { key: "sent", label: "Sent", statuses: ["placed", "accepted"] },
    { key: "progress", label: "In progress", statuses: ["preparing"] },
    order.fulfillment_type === "delivery"
      ? { key: "handoff", label: "On the way", statuses: ["out_for_delivery"] }
      : { key: "handoff", label: "Ready for pickup", statuses: ["ready"] },
    { key: "completed", label: "Completed", statuses: ["completed"] },
  ].map((stage) => ({
    ...stage,
    event: order.history.find((event) => stage.statuses.includes(event.to_status)),
  }));
}

function formatEventTime(value) {
  if (!value) return "";
  return new Intl.DateTimeFormat("en-IL", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function OrderTimeline({ order }) {
  return (
    <ol className="admin-order-timeline" aria-label={`Progress for ${order.order_number}`}>
      {timelineStages(order).map((stage) => (
        <li key={stage.key} className={stage.event ? "is-complete" : ""}>
          <span className="admin-order-timeline__marker">
            {stage.event && <Icon name="check" size={15} />}
          </span>
          <div>
            <strong>{stage.label}</strong>
            <small>{stage.event ? formatEventTime(stage.event.created_at) : "Pending"}</small>
          </div>
        </li>
      ))}
    </ol>
  );
}

export function AdminOrdersPage() {
  const [status, setStatus] = useState("");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(null);
  const debouncedSearch = useDebouncedValue(search);
  const load = useCallback(
    ({ page, limit }) => adminService.orders({ page, limit, status, search: debouncedSearch }),
    [debouncedSearch, status],
  );
  const history = useLoadMoreResource(load, { pageSize: 6 });
  const orders = history.items;

  return (
    <div className="portal-page admin-orders-page">
      <PageHeader
        eyebrow="Order operations"
        title="Order logs"
        description="Follow every order from submission through customer-confirmed completion."
      />
      <section className="admin-order-filters" aria-label="Order filters">
        <label>
          <span>Search</span>
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Order, customer, email, or vendor"
          />
        </label>
        <label>
          <span>Status</span>
          <select value={status} onChange={(event) => setStatus(event.target.value)}>
            <option value="">All statuses</option>
            {statuses.map((value) => (
              <option key={value} value={value}>{orderStatusLabel(value)}</option>
            ))}
          </select>
        </label>
      </section>

      {history.loading && <LoadingState label="Loading order history..." />}
      {history.error && !orders.length && <ErrorState error={history.error} onRetry={history.reload} />}
      {!history.loading && !history.error && !orders.length && (
        <EmptyState
          icon="orders"
          title="No matching orders"
          message="Orders will appear here as soon as customers submit them."
        />
      )}

      <div className="admin-order-list">
        {orders.map((order) => (
          <article className="admin-order-card" key={order.public_id}>
            <header>
              <div>
                <span className="eyebrow">{order.order_number}</span>
                <h2>{order.customer_name} <small>with {order.vendor_name}</small></h2>
              </div>
              <StatusChip status={order.status} />
            </header>
            <dl className="admin-order-meta">
              <div><dt>Customer</dt><dd>{order.customer_name}<small>{order.customer_email}</small></dd></div>
              <div><dt>Vendor</dt><dd>{order.vendor_name}<small>{titleCase(order.vendor_type)}</small></dd></div>
              <div><dt>Fulfillment</dt><dd>{titleCase(order.fulfillment_type)}<small>{order.delivery_building_name ?? "Vendor pickup"}</small></dd></div>
              <div><dt>Total</dt><dd>{formatMoney(order.total_agorot, order.currency)}<small>{formatDate(order.created_at)}</small></dd></div>
            </dl>
            {order.delivery_location && (
              <p className="admin-order-location"><Icon name="building" size={17} /> {order.delivery_location}</p>
            )}
            <OrderTimeline order={order} />
            <footer>
              <span>{order.history.length} recorded status {order.history.length === 1 ? "event" : "events"}</span>
              <button className="button button--ghost" onClick={() => setSelected(order.public_id)}>
                View order details
              </button>
            </footer>
          </article>
        ))}
      </div>
      <LoadMoreButton hasMore={history.meta.hasMore} loading={history.loadingMore} error={orders.length ? history.error : null} onLoadMore={history.loadMore} />

      {selected && (
        <OrderDetails
          publicId={selected}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  );
}

function OrderDetails({ publicId, onClose }) {
  const load = useCallback(() => adminService.order(publicId), [publicId]);
  const { data, loading, error, reload } = useApiResource(load);
  const order = data?.data;

  return (
    <div className="drawer-backdrop">
      <section className="editor-drawer editor-drawer--wide" role="dialog" aria-modal="true">
        <div className="editor-drawer__head">
          <div>
            <span className="eyebrow">Order record</span>
            <h2>{order?.order_number ?? "Order details"}</h2>
          </div>
          <button className="icon-button" onClick={onClose} aria-label="Close">
            <Icon name="close" />
          </button>
        </div>
        {loading && <LoadingState />}
        {error && <ErrorState error={error} onRetry={reload} />}
        {order && (
          <>
            <div className="record-summary">
              <span><strong>{order.customer_name}</strong><small>{order.vendor_name}</small></span>
              <StatusChip status={order.status} />
            </div>
            <OrderTimeline order={order} />
            <div className="line-items admin-order-items">
              {order.items.map((item) => (
                <div key={item.product_public_id}>
                  <span><strong>{item.quantity} × {item.product_name}</strong><small>{item.sku}</small></span>
                  <strong>{formatMoney(item.line_total_agorot)}</strong>
                </div>
              ))}
            </div>
            <dl className="price-summary">
              <div><dt>Items</dt><dd>{formatMoney(order.subtotal_agorot)}</dd></div>
              <div><dt>Delivery</dt><dd>{formatMoney(order.delivery_fee_agorot)}</dd></div>
              <div className="price-summary__total"><dt>Total</dt><dd>{formatMoney(order.total_agorot)}</dd></div>
            </dl>
            <section className="admin-order-activity">
              <h3>Recorded activity</h3>
              {order.history.map((event) => (
                <div key={`${event.to_status}-${event.created_at}`}>
                  <span><Icon name="check" size={14} /></span>
                  <p>
                    <strong>{orderStatusLabel(event.to_status)}</strong>
                    <small>{formatDate(event.created_at)} · {event.actor_name ?? "System"}</small>
                    {event.note && <em>{event.note}</em>}
                  </p>
                </div>
              ))}
            </section>
          </>
        )}
      </section>
    </div>
  );
}
