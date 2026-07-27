import { useCallback, useState } from "react";
import { PageHeader } from "../components/ui/PageHeader.jsx";
import { EmptyState, ErrorState, LoadingState } from "../components/ui/PageState.jsx";
import { StatusChip } from "../components/ui/StatusChip.jsx";
import { useApiResource } from "../hooks/useApiResource.js";
import { partnerService } from "../services/partnerService.js";
import { formatDate, formatMoney, titleCase } from "../utils/format.js";

const nextStatuses = {
  placed: ["accepted", "needs_attention"],
  accepted: ["preparing", "needs_attention"],
  preparing: ["ready", "needs_attention"],
  ready: ["completed", "out_for_delivery", "needs_attention"],
  out_for_delivery: ["completed", "needs_attention"],
};

export function PartnerOrdersPage() {
  const [selected, setSelected] = useState(null);
  const load = useCallback(() => partnerService.orders({ limit: 50 }), []);
  const { data, loading, error, reload } = useApiResource(load);
  const orders = data?.data ?? [];
  return (
    <div className="portal-page">
      <PageHeader eyebrow="Operations" title="Orders" description="Accept, prepare, and complete customer orders." />
      {loading && <LoadingState />}
      {error && <ErrorState error={error} onRetry={reload} />}
      {!loading && !error && !orders.length && <EmptyState icon="orders" title="No orders yet" message="Paid customer orders will appear here." />}
      <div className="data-table-wrap">
        <table className="data-table">
          <thead><tr><th>Order</th><th>Customer</th><th>Fulfillment</th><th>Total</th><th>Status</th><th></th></tr></thead>
          <tbody>{orders.map((order) => (
            <tr key={order.public_id}>
              <td><strong>{order.order_number}</strong><small>{formatDate(order.created_at)}</small></td>
              <td>{order.customer_name}</td>
              <td>{titleCase(order.fulfillment_type)}{order.delivery_building_name && <small>{order.delivery_building_name}</small>}</td>
              <td>{formatMoney(order.total_agorot)}</td>
              <td><StatusChip status={order.status} /></td>
              <td className="row-actions"><button onClick={() => setSelected(order)}>Manage</button></td>
            </tr>
          ))}</tbody>
        </table>
      </div>
      {selected && <OrderManager publicId={selected.public_id} onClose={() => setSelected(null)} onSaved={() => { setSelected(null); reload(); }} />}
    </div>
  );
}

function OrderManager({ publicId, onClose, onSaved }) {
  const load = useCallback(() => partnerService.order(publicId), [publicId]);
  const { data, loading, error, reload } = useApiResource(load);
  const [status, setStatus] = useState("");
  const [note, setNote] = useState("");
  const [actionError, setActionError] = useState(null);
  const [busy, setBusy] = useState(false);
  const order = data?.data;

  async function update(event) {
    event.preventDefault();
    setBusy(true);
    setActionError(null);
    try {
      await partnerService.updateOrder(publicId, { status, note: note || null });
      onSaved();
    } catch (caught) {
      setActionError(caught);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="drawer-backdrop">
      <section className="editor-drawer" role="dialog" aria-modal="true">
        <div className="editor-drawer__head"><h2>Manage order</h2><button className="icon-button" onClick={onClose}>×</button></div>
        {loading && <LoadingState />}
        {error && <ErrorState error={error} onRetry={reload} />}
        {order && <>
          <div className="record-summary"><span><strong>{order.order_number}</strong><small>{order.customer_name}</small></span><StatusChip status={order.status} /></div>
          <div className="line-items">{order.items.map((item) => <div key={item.product_public_id}><span><strong>{item.quantity}× {item.product_name}</strong><small>{item.sku}</small></span><strong>{formatMoney(item.line_total_agorot)}</strong></div>)}</div>
          {order.pickup_code && <div className="pickup-code-inline"><span>Customer code</span><strong>{order.pickup_code}</strong></div>}
          {nextStatuses[order.status]?.length ? (
            <form onSubmit={update}>
              <label>Next status<select value={status} onChange={(event) => setStatus(event.target.value)} required><option value="">Choose an action</option>{nextStatuses[order.status].filter((value) => value !== "out_for_delivery" || order.fulfillment_type === "delivery").map((value) => <option key={value} value={value}>{titleCase(value)}</option>)}</select></label>
              <label>Internal progress note <span className="optional">Optional</span><textarea value={note} onChange={(event) => setNote(event.target.value)} maxLength={500} /></label>
              {actionError && <ErrorState error={actionError} />}
              <button className="button button--primary button--full" disabled={busy}>{busy ? "Updating..." : "Update order"}</button>
            </form>
          ) : <p className="muted">No online transition is available from this status.</p>}
        </>}
      </section>
    </div>
  );
}
