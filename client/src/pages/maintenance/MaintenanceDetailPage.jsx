import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Icon } from "../../components/ui/Icon.jsx";
import { ErrorState, LoadingState } from "../../components/ui/PageState.jsx";
import { StatusChip } from "../../components/ui/StatusChip.jsx";
import { useApiResource } from "../../hooks/useApiResource.js";
import { apiMediaUrl } from "../../services/core/apiClient.js";
import { maintenanceService } from "../../services/maintenance/maintenanceService.js";
import { formatDate, titleCase } from "../../utils/format.js";
import { token } from "../../utils/session.js";

export function MaintenanceDetailPage() {
  const { publicId } = useParams();
  const load = useCallback(() => maintenanceService.details(publicId), [publicId]);
  const { data, loading, error, reload } = useApiResource(load, [load]);
  const [comment, setComment] = useState("");
  const [actionError, setActionError] = useState(null);
  const [busy, setBusy] = useState(false);
  const ticket = data?.data;

  async function addComment(event) {
    event.preventDefault();
    setBusy(true);
    try {
      await maintenanceService.comment(publicId, { body: comment, isInternal: false });
      setComment("");
      reload();
    } catch (caught) {
      setActionError(caught);
    } finally {
      setBusy(false);
    }
  }

  if (loading) return <LoadingState label="Loading report..." />;
  if (error) return <ErrorState error={error} onRetry={reload} />;
  return (
    <div className="page-container detail-page">
      <Link className="back-link" to="/report">← All reports</Link>
      <section className="detail-hero">
        <div><span className="eyebrow">{ticket.ticket_number} · {titleCase(ticket.category)}</span><h1>{ticket.title}</h1><p>{ticket.building_name} · {ticket.location_text}</p></div>
        <StatusChip status={ticket.status} />
      </section>
      {ticket.emergencyContactMessage && <div className="urgent-notice"><Icon name="report" /><strong>{ticket.emergencyContactMessage}</strong></div>}
      <div className="detail-layout">
        <section className="detail-main">
          <article className="card detail-description"><h2>What was reported</h2><p>{ticket.description}</p><small>Submitted {formatDate(ticket.created_at)}</small></article>
          {ticket.attachments.length > 0 && (
            <section className="attachment-grid">
              {ticket.attachments.map((image) => (
                <PrivateImage key={image.public_id} publicId={image.public_id} alt={image.original_name} />
              ))}
            </section>
          )}
          <section className="card comment-section">
            <h2>Conversation</h2>
            <div className="comments">
              {ticket.comments.map((item) => (
                <article key={item.public_id}>
                  <span>{item.author_name.slice(0, 1)}</span>
                  <div><strong>{item.author_name}<small>{item.author_role === "admin" ? "Campus team" : "Reporter"}</small></strong><p>{item.body}</p><time>{formatDate(item.created_at)}</time></div>
                </article>
              ))}
              {!ticket.comments.length && <p className="muted">No comments yet.</p>}
            </div>
            {!["closed", "rejected"].includes(ticket.status) && (
              <form onSubmit={addComment} className="comment-form">
                <label className="sr-only" htmlFor="comment">Add comment</label>
                <textarea id="comment" value={comment} onChange={(event) => setComment(event.target.value)} maxLength={1000} placeholder="Add a useful update..." required />
                <button className="button button--primary" disabled={busy}>Send update</button>
              </form>
            )}
            {actionError && <ErrorState error={actionError} />}
          </section>
        </section>
        <aside className="detail-sidebar">
          <section className="card">
            <h2>Ticket details</h2>
            <dl className="detail-list">
              <div><dt>Requested priority</dt><dd>{titleCase(ticket.requested_priority)}</dd></div>
              <div><dt>Current priority</dt><dd>{titleCase(ticket.priority)}</dd></div>
              <div><dt>Assigned to</dt><dd>{ticket.assigned_admin_name ?? "Campus queue"}</dd></div>
            </dl>
          </section>
          <section className="card"><h2>History</h2><ol className="compact-timeline">{ticket.history.map((item) => <li key={`${item.event_type}-${item.created_at}`}><i /><div><strong>{titleCase(item.to_value ?? item.event_type)}</strong><small>{formatDate(item.created_at)}</small></div></li>)}</ol></section>
        </aside>
      </div>
    </div>
  );
}

function PrivateImage({ publicId, alt }) {
  const [src, setSrc] = useState("");
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    let objectUrl = "";
    let active = true;
    fetch(apiMediaUrl(`/media/maintenance/${publicId}`), {
      headers: { Authorization: `Bearer ${token()}` },
    })
      .then((response) => {
        if (!response.ok) throw new Error();
        return response.blob();
      })
      .then((blob) => {
        objectUrl = URL.createObjectURL(blob);
        if (active) setSrc(objectUrl);
      })
      .catch(() => {
        if (active) setFailed(true);
      });
    return () => {
      active = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [publicId]);
  if (failed) return <div className="attachment-failed">Image unavailable</div>;
  return src ? <img src={src} alt={alt} /> : <div className="attachment-loading" />;
}
