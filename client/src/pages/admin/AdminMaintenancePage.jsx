import { useCallback, useState } from "react";
import { PageHeader } from "../../components/ui/PageHeader.jsx";
import { LoadMoreButton } from "../../components/ui/LoadMoreButton.jsx";
import { EmptyState, ErrorState, LoadingState } from "../../components/ui/PageState.jsx";
import { StatusChip } from "../../components/ui/StatusChip.jsx";
import { useApiResource } from "../../hooks/useApiResource.js";
import { useLoadMoreResource } from "../../hooks/useLoadMoreResource.js";
import { adminService } from "../../services/portals/adminService.js";
import { formatDate, titleCase } from "../../utils/format.js";
import { MaintenanceRoutePlan } from "./MaintenanceRoutePlan.jsx";

const transitions = {
  open: ["acknowledged", "rejected"],
  acknowledged: ["in_progress", "waiting_for_user", "rejected"],
  in_progress: ["waiting_for_user", "resolved"],
  waiting_for_user: ["in_progress", "resolved"],
  resolved: ["closed", "in_progress"],
};

export function AdminMaintenancePage() {
  const [statusFilter, setStatusFilter] = useState("");
  const [selected, setSelected] = useState(null);
  const [routeVersion, setRouteVersion] = useState(0);
  const load = useCallback(
    ({ page, limit }) => adminService.maintenance({ page, limit, status: statusFilter }),
    [statusFilter],
  );
  const queue = useLoadMoreResource(load, { pageSize: 10 });
  const tickets = queue.items;
  return (
    <div className="portal-page">
      <PageHeader
        eyebrow="Campus support"
        title="Maintenance queue"
        description="Prioritize, assign, update, and discuss campus issues."
        actions={<select aria-label="Filter by status" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}><option value="">All statuses</option>{["open", "acknowledged", "in_progress", "waiting_for_user", "resolved", "closed", "rejected"].map((value) => <option key={value} value={value}>{titleCase(value)}</option>)}</select>}
      />
      <MaintenanceRoutePlan
        key={routeVersion}
        onManageTicket={setSelected}
      />
      {queue.loading && <LoadingState />}
      {queue.error && !tickets.length && <ErrorState error={queue.error} onRetry={queue.reload} />}
      {!queue.loading && !queue.error && !tickets.length && <EmptyState icon="report" title="Queue is clear" message="No maintenance tickets match this filter." />}
      <div className="data-table-wrap">
        <table className="data-table">
          <thead><tr><th>Ticket</th><th>Location</th><th>Reporter</th><th>Priority</th><th>Status</th><th></th></tr></thead>
          <tbody>{tickets.map((ticket) => (
            <tr key={ticket.public_id}>
              <td><strong>{ticket.title}</strong><small>{ticket.ticket_number} · {titleCase(ticket.category)}</small></td>
              <td>{ticket.building_name}<small>{ticket.location_text}</small></td>
              <td>{ticket.reporter_name}</td>
              <td><StatusChip status={ticket.priority} /></td>
              <td><StatusChip status={ticket.status} /></td>
              <td className="row-actions"><button onClick={() => setSelected(ticket)}>Manage</button></td>
            </tr>
          ))}</tbody>
        </table>
      </div>
      <LoadMoreButton hasMore={queue.meta.hasMore} loading={queue.loadingMore} error={tickets.length ? queue.error : null} onLoadMore={queue.loadMore} />
      {selected && <MaintenanceManager publicId={selected.public_id} onClose={() => setSelected(null)} onSaved={() => {
        setSelected(null);
        queue.reload();
        setRouteVersion((current) => current + 1);
      }} />}
    </div>
  );
}

function MaintenanceManager({ publicId, onClose, onSaved }) {
  const load = useCallback(async () => {
    const [details, admins] = await Promise.all([
      adminService.maintenanceDetails(publicId),
      adminService.users({ role: "admin", status: "active", limit: 50 }),
    ]);
    return { details, admins };
  }, [publicId]);
  const { data, loading, error, reload } = useApiResource(load);
  const [status, setStatus] = useState("");
  const [priority, setPriority] = useState("");
  const [assignee, setAssignee] = useState("");
  const [note, setNote] = useState("");
  const [comment, setComment] = useState("");
  const [internal, setInternal] = useState(false);
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState(null);
  const ticket = data?.details?.data;
  const admins = data?.admins?.data ?? [];

  async function updateTicket(event) {
    event.preventDefault();
    setBusy(true);
    setActionError(null);
    try {
      await adminService.updateMaintenance(publicId, {
        status,
        priority: priority || ticket.priority,
        assignedAdminPublicId: assignee || ticket.assigned_admin_public_id || null,
        note: note || null,
      });
      onSaved();
    } catch (caught) {
      setActionError(caught);
    } finally {
      setBusy(false);
    }
  }

  async function addComment(event) {
    event.preventDefault();
    setBusy(true);
    setActionError(null);
    try {
      await adminService.commentMaintenance(publicId, { body: comment, isInternal: internal });
      setComment("");
      await reload();
    } catch (caught) {
      setActionError(caught);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="drawer-backdrop">
      <section className="editor-drawer editor-drawer--wide" role="dialog" aria-modal="true">
        <div className="editor-drawer__head"><h2>Maintenance ticket</h2><button className="icon-button" onClick={onClose}>×</button></div>
        {loading && <LoadingState />}
        {error && <ErrorState error={error} onRetry={reload} />}
        {ticket && <>
          <div className="record-summary"><span><strong>{ticket.title}</strong><small>{ticket.ticket_number} · {ticket.building_name} · {ticket.location_text}</small></span><StatusChip status={ticket.status} /></div>
          <div className="ticket-description"><span className="eyebrow">{titleCase(ticket.category)}</span><p>{ticket.description}</p><small>Reported by {ticket.reporter_name} on {formatDate(ticket.created_at)}</small></div>
          {(transitions[ticket.status] ?? []).length > 0 && (
            <form onSubmit={updateTicket}>
              <div className="field-row">
                <label>Status<select value={status || ticket.status} onChange={(event) => setStatus(event.target.value)} required><option value={ticket.status}>Keep {titleCase(ticket.status)}</option>{transitions[ticket.status].map((value) => <option key={value} value={value}>{titleCase(value)}</option>)}</select></label>
                <label>Priority<select value={priority || ticket.priority} onChange={(event) => setPriority(event.target.value)}><option value="low">Low</option><option value="normal">Normal</option><option value="urgent">Urgent</option></select></label>
              </div>
              <label>Assigned administrator<select value={assignee || ticket.assigned_admin_public_id || ""} onChange={(event) => setAssignee(event.target.value)}><option value="">Assign to me</option>{admins.map((admin) => <option key={admin.public_id} value={admin.public_id}>{admin.display_name}</option>)}</select></label>
              <label>History note <span className="optional">Optional</span><textarea value={note} onChange={(event) => setNote(event.target.value)} maxLength={500} /></label>
              <button className="button button--primary" disabled={busy}>Update ticket</button>
            </form>
          )}
          <section className="drawer-comments">
            <h3>Conversation</h3>
            <div className="comments">{ticket.comments.map((item) => <article key={item.public_id}><span>{item.author_name.slice(0, 1)}</span><div><strong>{item.author_name}{item.is_internal && <small>Internal</small>}</strong><p>{item.body}</p><time>{formatDate(item.created_at)}</time></div></article>)}</div>
            {!["closed", "rejected"].includes(ticket.status) && <form onSubmit={addComment}><label>New comment<textarea value={comment} onChange={(event) => setComment(event.target.value)} maxLength={1000} required /></label><label className="check-field"><input type="checkbox" checked={internal} onChange={(event) => setInternal(event.target.checked)} /> Internal note (hidden from reporter)</label><button className="button button--secondary" disabled={busy}>Add comment</button></form>}
          </section>
          {actionError && <ErrorState error={actionError} />}
        </>}
      </section>
    </div>
  );
}
