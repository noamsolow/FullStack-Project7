import { useCallback, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Icon } from "../../components/ui/Icon.jsx";
import { ErrorState, LoadingState } from "../../components/ui/PageState.jsx";
import { StatusChip } from "../../components/ui/StatusChip.jsx";
import { useApiResource } from "../../hooks/useApiResource.js";
import { downloadPrivateFile } from "../../services/core/apiClient.js";
import { printService } from "../../services/printing/printService.js";
import { formatDate, formatMoney, titleCase } from "../../utils/format.js";

export function PrintJobDetailPage() {
  const { publicId } = useParams();
  const load = useCallback(() => printService.details(publicId), [publicId]);
  const { data, loading, error, reload } = useApiResource(load, [load]);
  const [actionError, setActionError] = useState(null);
  const [busy, setBusy] = useState(false);
  const [reason, setReason] = useState("");
  const job = data?.data;

  async function pay() {
    setBusy(true);
    setActionError(null);
    try {
      const response = await printService.checkout(publicId);
      if (response.data.paymentRequired && response.data.approvalUrl) {
        sessionStorage.setItem("levgo.pending-payment", JSON.stringify({ type: "print", publicId }));
        window.location.assign(response.data.approvalUrl);
        return;
      }
      await reload();
      setBusy(false);
    } catch (caught) {
      setActionError(caught);
      setBusy(false);
    }
  }

  async function cancel(event) {
    event.preventDefault();
    setBusy(true);
    setActionError(null);
    try {
      await printService.cancel(publicId, reason);
      setReason("");
      await reload();
    } catch (caught) {
      setActionError(caught);
    } finally {
      setBusy(false);
    }
  }

  if (loading) return <LoadingState label="Loading print job..." />;
  if (error) return <ErrorState error={error} onRetry={reload} />;
  return (
    <div className="page-container detail-page">
      <Link className="back-link" to="/print/jobs">← All print jobs</Link>
      <section className="detail-hero">
        <div><span className="eyebrow">Print job {job.job_number}</span><h1>{job.file_name}</h1><p>{job.vendor_name} · {job.building_name}</p></div>
        <StatusChip status={job.status} />
      </section>
      <div className="detail-layout">
        <section className="detail-main card">
          <h2>Progress</h2>
          <ol className="timeline">
            {job.history.map((event) => (
              <li key={`${event.to_status}-${event.created_at}`}>
                <span><Icon name="check" size={16} /></span>
                <div><strong>{titleCase(event.to_status)}</strong><small>{formatDate(event.created_at)}{event.actor_name ? ` · ${event.actor_name}` : ""}</small>{event.note && <p>{event.note}</p>}</div>
              </li>
            ))}
          </ol>
        </section>
        <aside className="detail-sidebar">
          <section className="card">
            <h2>Print settings</h2>
            <dl className="detail-list">
              <div><dt>Paper</dt><dd>{job.paper_size}</dd></div>
              <div><dt>Ink</dt><dd>{titleCase(job.color_mode)}</dd></div>
              <div><dt>Sides</dt><dd>{titleCase(job.sides)}</dd></div>
              <div><dt>Copies</dt><dd>{job.copies}</dd></div>
              <div><dt>Stapled</dt><dd>{job.stapled ? "Yes" : "No"}</dd></div>
              <div><dt>Lamination</dt><dd>{job.laminated ? "Every printed A4 sheet" : "No"}</dd></div>
              <div><dt>Spiral binding</dt><dd>{job.spiral_bound ? "Yes" : "No"}</dd></div>
              <div><dt>Fixed price</dt><dd>{job.quote_agorot ? formatMoney(job.quote_agorot) : "Calculating"}</dd></div>
            </dl>
            <button className="button button--secondary button--full" onClick={() => downloadPrivateFile(`/media/print-files/${job.file_public_id}`, job.file_name)}>
              <Icon name="upload" /> Download my PDF
            </button>
          </section>
          {job.status === "quoted" && (
            <section className="action-card">
              <span className="eyebrow">Quote ready</span>
              <h2>{formatMoney(job.quote_agorot)}</h2>
              <p>Valid until {formatDate(job.quote_expires_at)}.</p>
              <button className="button button--primary button--full" onClick={pay} disabled={busy}>
                {busy ? "Approving quote..." : "Approve quote"}
              </button>
              <p>No online payment is required.</p>
            </section>
          )}
          {job.quote_agorot && job.status !== "quoted" && (
            <section className="action-card">
              <span className="eyebrow">Fixed print price</span>
              <h2>{formatMoney(job.quote_agorot)}</h2>
              <p>Calculated at ₪0.10 per black-and-white PDF page or ₪0.50 per color page, multiplied by the number of copies.</p>
            </section>
          )}
          {job.status === "submitted" && (
            <section className="delivery-notice">
              Your file was sent securely. The print center must begin production before it can mark the job as ready for pickup.
            </section>
          )}
          {["ready", "completed"].includes(job.status) && (
            <section className="pickup-card">
              <span>Your pickup code</span><strong>{job.pickup_code}</strong><p>Show this code at {job.vendor_name}.</p>
            </section>
          )}
          {["submitted", "quoted", "pending_payment", "paid"].includes(job.status) && (
            <form className="card compact-form" onSubmit={cancel}>
              <h2>{job.status === "paid" ? "Request cancellation" : "Cancel print job"}</h2>
              <p>{job.status === "paid" ? "Approved jobs require manual cancellation review." : "This stops the job before production begins."}</p>
              <label>Reason<textarea value={reason} onChange={(event) => setReason(event.target.value)} minLength={5} maxLength={500} required /></label>
              <button className="button button--danger button--full" disabled={busy}>{busy ? "Submitting..." : "Continue"}</button>
            </form>
          )}
          {actionError && <ErrorState error={actionError} />}
        </aside>
      </div>
    </div>
  );
}
