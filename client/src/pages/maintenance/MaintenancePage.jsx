import { useCallback, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Icon } from "../../components/ui/Icon.jsx";
import { PageHeader } from "../../components/ui/PageHeader.jsx";
import { LoadMoreButton } from "../../components/ui/LoadMoreButton.jsx";
import { ErrorState, LoadingState } from "../../components/ui/PageState.jsx";
import { StatusChip } from "../../components/ui/StatusChip.jsx";
import { useApiResource } from "../../hooks/useApiResource.js";
import { useLoadMoreResource } from "../../hooks/useLoadMoreResource.js";
import { catalogService } from "../../services/catalog/catalogService.js";
import { maintenanceService } from "../../services/maintenance/maintenanceService.js";
import { formatDate, titleCase } from "../../utils/format.js";

const initial = {
  buildingId: "",
  locationText: "",
  category: "it_equipment",
  title: "",
  description: "",
  requestedPriority: "normal",
};

export function MaintenancePage() {
  const navigate = useNavigate();
  const fileRef = useRef(null);
  const [form, setForm] = useState(initial);
  const [files, setFiles] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const loadBuildings = useCallback(() => catalogService.buildings({ limit: 50 }), []);
  const loadTickets = useCallback(
    ({ page, limit }) => maintenanceService.list({ page, limit }),
    [],
  );
  const buildings = useApiResource(loadBuildings, [loadBuildings]);
  const tickets = useLoadMoreResource(loadTickets, { pageSize: 6 });

  function update(event) {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  }

  async function submit(event) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    const body = new FormData();
    Object.entries(form).forEach(([key, value]) => body.append(key, value));
    files.forEach((file) => body.append("images", file));
    try {
      const response = await maintenanceService.create(body);
      navigate(`/report/${response.data.public_id}`);
    } catch (caught) {
      setError(caught);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="page-container maintenance-page">
      <PageHeader
        eyebrow="Campus support"
        title="Notice something? Report it."
        description="Broken, missing, unsafe, or simply needed—send the campus team a clear report and track it."
      />
      <div className="maintenance-layout">
        <form className="maintenance-form card" onSubmit={submit}>
          <h2>New maintenance report</h2>
          <div className="field-row">
            <label>
              Building
              <select name="buildingId" value={form.buildingId} onChange={update} required>
                <option value="">Choose building</option>
                {buildings.data?.data?.map((building) => (
                  <option key={building.id} value={building.id}>{building.short_name}</option>
                ))}
              </select>
            </label>
            <label>Room or location<input name="locationText" value={form.locationText} onChange={update} placeholder="Room 214, east hallway..." required /></label>
          </div>
          <div className="field-row">
            <label>
              Category
              <select name="category" value={form.category} onChange={update}>
                {["electrical", "plumbing", "furniture", "cleaning", "safety", "it_equipment", "missing_supplies", "other"].map((value) => (
                  <option key={value} value={value}>{titleCase(value)}</option>
                ))}
              </select>
            </label>
            <label>
              Urgency
              <select name="requestedPriority" value={form.requestedPriority} onChange={update}>
                <option value="low">Low</option><option value="normal">Normal</option><option value="urgent">Urgent</option>
              </select>
            </label>
          </div>
          {form.requestedPriority === "urgent" && (
            <div className="urgent-notice" role="note"><Icon name="report" /><span><strong>Immediate safety risk?</strong> Contact campus security directly. This form is not an emergency channel.</span></div>
          )}
          <label>Short title<input name="title" value={form.title} onChange={update} minLength={5} maxLength={140} required /></label>
          <label>Description<textarea name="description" value={form.description} onChange={update} minLength={10} maxLength={1500} placeholder="What happened, what is affected, and what would help?" required /></label>
          <label>
            Photos <span className="optional">Optional · up to 3</span>
            <button type="button" className="mini-upload" onClick={() => fileRef.current?.click()}><Icon name="upload" /> {files.length ? `${files.length} selected` : "Add photos"}</button>
            <input ref={fileRef} className="sr-only" type="file" multiple accept="image/jpeg,image/png,image/webp" onChange={(event) => setFiles(Array.from(event.target.files ?? []).slice(0, 3))} />
          </label>
          {error && <ErrorState error={error} />}
          <button className="button button--primary button--large" disabled={submitting}>{submitting ? "Submitting..." : "Submit report"}</button>
        </form>
        <aside className="ticket-panel">
          <div className="ticket-panel__heading"><div><span className="eyebrow">Your reports</span><h2>Recent activity</h2></div></div>
          {tickets.loading && <LoadingState />}
          {tickets.error && !tickets.items.length && <ErrorState error={tickets.error} onRetry={tickets.reload} />}
          <div aria-live="polite">
          {tickets.items.map((ticket) => (
            <Link key={ticket.public_id} to={`/report/${ticket.public_id}`} className="ticket-card">
              <div><span className="ticket-number">{ticket.ticket_number}</span><StatusChip status={ticket.status} /></div>
              <h3>{ticket.title}</h3>
              <p><Icon name="building" size={15} /> {ticket.building_name} · {ticket.location_text}</p>
              <small>{formatDate(ticket.created_at)}</small>
            </Link>
          ))}
          </div>
          {!tickets.loading && !tickets.error && !tickets.items.length && <p className="muted">No reports yet. That is usually good news.</p>}
          <LoadMoreButton
            hasMore={tickets.meta.hasMore}
            loading={tickets.loadingMore}
            error={tickets.items.length ? tickets.error : null}
            onLoadMore={tickets.loadMore}
          />
        </aside>
      </div>
    </div>
  );
}
