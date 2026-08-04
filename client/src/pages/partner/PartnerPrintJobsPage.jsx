import { useCallback, useState } from "react";
import { PageHeader } from "../../components/ui/PageHeader.jsx";
import { LoadMoreButton } from "../../components/ui/LoadMoreButton.jsx";
import { EmptyState, ErrorState, LoadingState } from "../../components/ui/PageState.jsx";
import { StatusChip } from "../../components/ui/StatusChip.jsx";
import { useApiResource } from "../../hooks/useApiResource.js";
import { useLoadMoreResource } from "../../hooks/useLoadMoreResource.js";
import { downloadPrivateFile } from "../../services/core/apiClient.js";
import { partnerService } from "../../services/portals/partnerService.js";
import { formatDate, formatMoney, titleCase } from "../../utils/format.js";

const nextStatuses = {
  submitted: ["printing", "rejected", "needs_attention"],
  quoted: ["printing", "rejected", "needs_attention"],
  paid: ["printing", "needs_attention"],
  printing: ["ready", "needs_attention"],
  ready: ["completed", "needs_attention"],
};

export function PartnerPrintJobsPage() {
  const [selected, setSelected] = useState(null);
  const load = useCallback(
    ({ page, limit }) => partnerService.printJobs({ page, limit }),
    [],
  );
  const history = useLoadMoreResource(load, { pageSize: 10 });
  const jobs = history.items;
  return (
    <div className="portal-page">
      <PageHeader eyebrow="Private printing" title="Print jobs" description="Review files securely, then update printing and pickup status. Prices are calculated automatically." />
      {history.loading && <LoadingState />}
      {history.error && !jobs.length && <ErrorState error={history.error} onRetry={history.reload} />}
      {!history.loading && !history.error && !jobs.length && <EmptyState icon="print" title="No print jobs" message="Customer uploads assigned to your print center will appear here." />}
      <div className="data-table-wrap">
        <table className="data-table">
          <thead><tr><th>Job</th><th>Customer</th><th>Settings</th><th>Fixed price</th><th>Status</th><th></th></tr></thead>
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
      <LoadMoreButton hasMore={history.meta.hasMore} loading={history.loadingMore} error={jobs.length ? history.error : null} onLoadMore={history.loadMore} />
      {selected && <PrintManager publicId={selected.public_id} onClose={() => setSelected(null)} onSaved={() => { setSelected(null); history.reload(); }} />}
    </div>
  );
}

function PrintManager({ publicId, onClose, onSaved }) {
  const load = useCallback(() => partnerService.printJob(publicId), [publicId]);
  const { data, loading, error, reload } = useApiResource(load);
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
      await partnerService.updatePrint(publicId, { status, note: note || null });
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
            <div><dt>Laminated</dt><dd>{job.laminated ? "Every printed A4 sheet" : "No"}</dd></div>
            <div><dt>Spiral bound</dt><dd>{job.spiral_bound ? "Yes" : "No"}</dd></div>
            <div><dt>Fixed price</dt><dd>{job.quote_agorot ? formatMoney(job.quote_agorot) : "Calculating"}</dd></div>
          </dl>
          <button className="button button--secondary button--full" onClick={() => downloadPrivateFile(`/media/print-files/${job.file_public_id}`, job.file_name)}>Download private PDF</button>
          <form onSubmit={submit}>
            <label>Next status<select value={status} onChange={(event) => setStatus(event.target.value)} required><option value="">Choose an action</option>{(nextStatuses[job.status] ?? []).map((value) => <option key={value} value={value}>{titleCase(value)}</option>)}</select></label>
            <label>Note <span className="optional">Optional</span><textarea value={note} onChange={(event) => setNote(event.target.value)} maxLength={500} /></label>
            {actionError && <ErrorState error={actionError} />}
            {nextStatuses[job.status]?.length && <button className="button button--primary button--full" disabled={busy}>{busy ? "Saving..." : job.status === "printing" ? "Mark as ready" : "Update print job"}</button>}
          </form>
        </>}
      </section>
    </div>
  );
}
