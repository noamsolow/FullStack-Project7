import { useCallback, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Icon } from "../../../components/ui/Icon.jsx";
import { ErrorState, LoadingState } from "../../../components/ui/PageState.jsx";
import { StatusChip } from "../../../components/ui/StatusChip.jsx";
import { useApiResource } from "../../../hooks/useApiResource.js";
import { usePolling } from "../../../hooks/usePolling.js";
import { orderService } from "../../../services/commerce/orderService.js";
import { formatDate, formatMoney, titleCase } from "../../../utils/format.js";

const terminal = new Set(["completed", "cancelled", "needs_attention"]);

export function OrderDetailPage() {
  const { publicId } = useParams();
  const load = useCallback(() => orderService.details(publicId), [publicId]);
  const { data, loading, error, reload } = useApiResource(load);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState(null);
  const order = data?.data;

  usePolling(reload, 15_000, Boolean(order && !terminal.has(order.status)));

  async function cancel(event) {
    event.preventDefault();
    setBusy(true);
    setActionError(null);
    try {
      await orderService.cancel(publicId, reason);
      setReason("");
      await reload();
    } catch (caught) {
      setActionError(caught);
    } finally {
      setBusy(false);
    }
  }

  if (loading && !order) return <LoadingState label="Loading order..." />;
  if (error && !order) return <ErrorState error={error} onRetry={reload} />;

  const canCancel = ["pending_payment", "placed"].includes(order.status);
  return (
    <div className="page-container detail-page">
      <Link className="back-link" to="/orders">← All orders</Link>
      <section className="detail-hero">
        <div>
          <span className="eyebrow">{order.order_number} · {titleCase(order.fulfillment_type)}</span>
          <h1>{order.vendor_name}</h1>
          <p>Placed {formatDate(order.created_at)}</p>
        </div>
        <StatusChip status={order.status} />
      </section>
      <div className="detail-layout">
        <section className="detail-main">
          <article className="card">
            <h2>Order items</h2>
            <div className="line-items">
              {order.items.map((item) => (
                <div key={item.product_public_id}>
                  <span><strong>{item.quantity}× {item.product_name}</strong><small>{item.sku}</small></span>
                  <strong>{formatMoney(item.line_total_agorot)}</strong>
                </div>
              ))}
            </div>
            <dl className="price-summary">
              <div><dt>Items</dt><dd>{formatMoney(order.subtotal_agorot)}</dd></div>
              <div><dt>Delivery</dt><dd>{formatMoney(order.delivery_fee_agorot)}</dd></div>
              <div className="price-summary__total"><dt>Total</dt><dd>{formatMoney(order.total_agorot)}</dd></div>
            </dl>
          </article>
          <article className="card">
            <h2>Progress</h2>
            <ol className="timeline">
              {order.history.map((event) => (
                <li key={`${event.to_status}-${event.created_at}`}>
                  <span><Icon name="check" size={16} /></span>
                  <div>
                    <strong>{titleCase(event.to_status)}</strong>
                    <small>{formatDate(event.created_at)}{event.actor_name ? ` · ${event.actor_name}` : ""}</small>
                    {event.note && <p>{event.note}</p>}
                  </div>
                </li>
              ))}
            </ol>
          </article>
        </section>
        <aside className="detail-sidebar">
          {["ready", "completed"].includes(order.status) && (
            <section className="pickup-card">
              <span>Your pickup code</span>
              <strong>{order.pickup_code}</strong>
              <p>Show this code when collecting your order.</p>
            </section>
          )}
          <section className="card">
            <h2>Fulfillment</h2>
            <dl className="detail-list">
              <div><dt>Method</dt><dd>{titleCase(order.fulfillment_type)}</dd></div>
              {order.delivery_building_name && <div><dt>Building</dt><dd>{order.delivery_building_name}</dd></div>}
              {order.delivery_location && <div><dt>Meeting point</dt><dd>{order.delivery_location}</dd></div>}
              <div><dt>Payment</dt><dd>{titleCase(order.payment?.status ?? "unknown")}</dd></div>
            </dl>
          </section>
          {canCancel && (
            <form className="card compact-form" onSubmit={cancel}>
              <h2>{order.status === "placed" ? "Request cancellation" : "Cancel checkout"}</h2>
              <p>{order.status === "placed" ? "Paid cancellations require manual review." : "Reserved stock will be returned."}</p>
              <label>Reason<textarea value={reason} onChange={(event) => setReason(event.target.value)} minLength={5} maxLength={500} required /></label>
              <button className="button button--danger button--full" disabled={busy}>{busy ? "Submitting..." : "Continue"}</button>
              {actionError && <ErrorState error={actionError} />}
            </form>
          )}
        </aside>
      </div>
    </div>
  );
}
