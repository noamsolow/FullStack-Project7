import { useCallback, useState } from "react";
import { PageHeader } from "../../components/ui/PageHeader.jsx";
import { EmptyState, ErrorState, LoadingState } from "../../components/ui/PageState.jsx";
import { StatusChip } from "../../components/ui/StatusChip.jsx";
import { useApiResource } from "../../hooks/useApiResource.js";
import { downloadPrivateFile } from "../../services/core/apiClient.js";
import { partnerService } from "../../services/portals/partnerService.js";
import { formatDate, formatMoney, titleCase } from "../../utils/format.js";

const nextStatuses = {
  paid: ["printing", "needs_attention"],
  printing: ["ready", "needs_attention"],
  ready: ["completed", "needs_attention"],
  submitted: ["rejected"],
};

export function PartnerPrintJobsPage() {
  const [selected, setSelected] = useState(null);
  const load = useCallback(() => partnerService.printJobs({ limit: 50 }), []);
  const { data, loading, error, reload } = useApiResource(load);
  const jobs = data?.data ?? [];
  return (
    <div className="portal-page">
      <PageHeader eyebrow="Private printing" title="Print jobs" description="Review files securely, quote accurately, and prepare pickup." />
      {loading && <LoadingState />}
      {error && <ErrorState error={error} onRetry={reload} />}
      {!loading && !error && !jobs.length && <EmptyState icon="print" title="No print jobs" message="Customer uploads assigned to your print center will appear here." />}
      <div className="data-table-wrap">
        <table className="data-table">
          <thead><tr><th>Job</th><th>Customer</th><th>Settings</th><th>Quote</th><th>Status</th><th></th></tr></thead>
          <tbody>{jobs.map((job) => (
            <tr key={job.public_id}>
              <td><strong>{job.job_number}</strong><small>{formatDate(job.created_at)}</small></td>
              <td>{job.customer_name}</td>
              <td>{job.paper_size} · {titleCase(job.color_mode)}<small>{job.copies} copies · {titleCase(job.sides)} sided</small></td>
              <td>{job.quote_agorot ? formatMoney(job.quote_agorot) : "Not quoted"}</td>
              <td><StatusChip status={job.status} /></td>
              <td className="row-actions"><button onClick={() => setSelected(job)}>Review</button></td>
            </tr>
          ))}</tbody>
        </table>
      </div>
      {selected && <PrintManager publicId={selected.public_id} onClose={() => setSelected(null)} onSaved={() => { setSelected(null); reload(); }} />}
    </div>
  );
}

function PrintManager({ publicId, onClose, onSaved }) {
  const load = useCallback(() => partnerService.printJob(publicId), [publicId]);
  const { data, loading, error, reload } = useApiResource(load);
  const [quote, setQuote] = useState("");
  const [status, setStatus] = useState("");
  const [note, setNote] = useState("");
  const [actionError, setActionError] = useState(null);
  const [busy, setBusy] = useState(false);
  const job = data?.data;

  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setActionError(null);
    try {
      if (job.status === "submitted") {
        await partnerService.quotePrint(publicId, {
          quoteAgorot: Math.round(Number(quote) * 100),
          note: note || null,
        });
      } else {
        await partnerService.updatePrint(publicId, { status, note: note || null });
      }
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
        <div className="editor-drawer__head"><h2>Review print job</h2><button className="icon-button" onClick={onClose}>×</button></div>
        {loading && <LoadingState />}
        {error && <ErrorState error={error} onRetry={reload} />}
        {job && <>
          <div className="record-summary"><span><strong>{job.job_number}</strong><small>{job.customer_name}</small></span><StatusChip status={job.status} /></div>
          <dl className="detail-list">
            <div><dt>File</dt><dd>{job.file_name}</dd></div>
            <div><dt>Paper</dt><dd>{job.paper_size}</dd></div>
            <div><dt>Ink</dt><dd>{titleCase(job.color_mode)}</dd></div>
            <div><dt>Sides</dt><dd>{titleCase(job.sides)}</dd></div>
            <div><dt>Copies</dt><dd>{job.copies}</dd></div>
            <div><dt>Stapled</dt><dd>{job.stapled ? "Yes" : "No"}</dd></div>
          </dl>
          <button className="button button--secondary button--full" onClick={() => downloadPrivateFile(`/media/print-files/${job.file_public_id}`, job.file_name)}>Download private PDF</button>
          <form onSubmit={submit}>
            {job.status === "submitted" ? (
              <label>Final quote (ILS)<input type="number" min="1" max="2000" step="0.01" value={quote} onChange={(event) => setQuote(event.target.value)} required /></label>
            ) : (
              <label>Next status<select value={status} onChange={(event) => setStatus(event.target.value)} required><option value="">Choose an action</option>{(nextStatuses[job.status] ?? []).map((value) => <option key={value} value={value}>{titleCase(value)}</option>)}</select></label>
            )}
            <label>Note <span className="optional">Optional</span><textarea value={note} onChange={(event) => setNote(event.target.value)} maxLength={500} /></label>
            {actionError && <ErrorState error={actionError} />}
            {(job.status === "submitted" || nextStatuses[job.status]?.length) && <button className="button button--primary button--full" disabled={busy}>{busy ? "Saving..." : job.status === "submitted" ? "Send quote" : "Update print job"}</button>}
          </form>
        </>}
      </section>
    </div>
  );
}
