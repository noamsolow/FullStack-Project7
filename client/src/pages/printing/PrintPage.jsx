import { useCallback, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Icon } from "../../components/ui/Icon.jsx";
import { PageHeader } from "../../components/ui/PageHeader.jsx";
import { ErrorState, LoadingState } from "../../components/ui/PageState.jsx";
import { StatusChip } from "../../components/ui/StatusChip.jsx";
import { useApiResource } from "../../hooks/useApiResource.js";
import { catalogService } from "../../services/catalog/catalogService.js";
import { printService } from "../../services/printing/printService.js";
import { formatDate } from "../../utils/format.js";

const initial = {
  vendorPublicId: "",
  paperSize: "A4",
  colorMode: "black_white",
  sides: "double",
  copies: "1",
  stapled: false,
  customerNote: "",
};

export function PrintPage() {
  const navigate = useNavigate();
  const fileRef = useRef(null);
  const [form, setForm] = useState(initial);
  const [file, setFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const loadCenters = useCallback(() => catalogService.printCenters(), []);
  const loadJobs = useCallback(() => printService.list({ limit: 6 }), []);
  const centers = useApiResource(loadCenters, [loadCenters]);
  const jobs = useApiResource(loadJobs, [loadJobs]);

  function update(event) {
    const { name, value, checked, type } = event.target;
    setForm((current) => ({ ...current, [name]: type === "checkbox" ? checked : value }));
  }

  async function submit(event) {
    event.preventDefault();
    if (!file) {
      setError(new Error("Choose a PDF to continue."));
      return;
    }
    setSubmitting(true);
    setError(null);
    const body = new FormData();
    Object.entries(form).forEach(([key, value]) => body.append(key, String(value)));
    body.append("document", file);
    try {
      const response = await printService.submit(body);
      navigate(`/print/${response.data.public_id}`);
    } catch (caught) {
      setError(caught);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="page-container print-page">
      <PageHeader
        eyebrow="Private campus printing"
        title="Upload now. Pay after review."
        description="Your PDF stays private. The selected print center checks the settings and sends a final quote."
      />
      <div className="print-layout">
        <form className="print-form card" onSubmit={submit}>
          <div className="step-heading"><span>01</span><div><h2>Choose your PDF</h2><p>One complete document, up to 15 MB.</p></div></div>
          <button
            type="button"
            className={`upload-dropzone ${file ? "upload-dropzone--selected" : ""}`}
            onClick={() => fileRef.current?.click()}
          >
            <Icon name={file ? "check" : "upload"} size={30} />
            <strong>{file ? file.name : "Select a PDF document"}</strong>
            <small>{file ? `${(file.size / 1024 / 1024).toFixed(2)} MB` : "PDF · maximum 15 MB"}</small>
          </button>
          <input
            ref={fileRef}
            className="sr-only"
            type="file"
            accept="application/pdf,.pdf"
            onChange={(event) => setFile(event.target.files?.[0] ?? null)}
          />

          <div className="step-heading"><span>02</span><div><h2>Print settings</h2><p>The print center verifies these before quoting.</p></div></div>
          <div className="field-row">
            <label>Paper size<select name="paperSize" value={form.paperSize} onChange={update}><option>A4</option><option>A3</option></select></label>
            <label>Ink<select name="colorMode" value={form.colorMode} onChange={update}><option value="black_white">Black & white</option><option value="color">Color</option></select></label>
          </div>
          <div className="field-row">
            <label>Sides<select name="sides" value={form.sides} onChange={update}><option value="double">Double-sided</option><option value="single">Single-sided</option></select></label>
            <label>Copies<input name="copies" type="number" min="1" max="20" value={form.copies} onChange={update} /></label>
          </div>
          <label className="check-field"><input name="stapled" type="checkbox" checked={form.stapled} onChange={update} /><span><strong>Staple each copy</strong><small>Subject to print-center availability</small></span></label>
          <label>Note <span className="optional">Optional</span><textarea name="customerNote" value={form.customerNote} onChange={update} maxLength={500} placeholder="Anything the print center should know?" /></label>

          <div className="step-heading"><span>03</span><div><h2>Collection point</h2><p>Your document is shared only with this print center.</p></div></div>
          {centers.loading && <LoadingState label="Loading print centers..." />}
          <div className="choice-list">
            {centers.data?.data?.map((center) => (
              <label key={center.public_id} className={form.vendorPublicId === center.public_id ? "selected" : ""}>
                <input type="radio" name="vendorPublicId" value={center.public_id} checked={form.vendorPublicId === center.public_id} onChange={update} />
                <span className="choice-list__icon"><Icon name="print" /></span>
                <span><strong>{center.name}</strong><small>{center.building_name} · {center.estimated_min_minutes}–{center.estimated_max_minutes} min after payment</small></span>
              </label>
            ))}
          </div>
          {centers.error && <ErrorState error={centers.error} onRetry={centers.reload} />}
          {error && <ErrorState error={error} />}
          <button className="button button--primary button--large button--full" disabled={submitting || !file || !form.vendorPublicId}>
            {submitting ? "Uploading securely..." : "Submit for quote"}
          </button>
          <p className="secure-note"><Icon name="shield" size={16} /> Payment happens only after a staff-reviewed quote.</p>
        </form>

        <aside className="print-sidebar">
          <div className="privacy-card">
            <span><Icon name="shield" size={28} /></span>
            <h2>Private by design</h2>
            <ul>
              <li>Generated storage filename</li>
              <li>Role-checked file access</li>
              <li>Never sent to the AI assistant</li>
              <li>Deleted after the retention period</li>
            </ul>
          </div>
          <div className="recent-panel">
            <div className="recent-panel__heading"><h2>Recent print jobs</h2><Link to="/print/jobs">View all</Link></div>
            {jobs.data?.data?.map((job) => (
              <Link key={job.public_id} to={`/print/${job.public_id}`} className="mini-list-row">
                <span className="mini-list-row__icon">PDF</span>
                <span><strong>{job.job_number}</strong><small>{formatDate(job.created_at)}</small></span>
                <StatusChip status={job.status} />
              </Link>
            ))}
            {!jobs.loading && !jobs.data?.data?.length && <p className="muted">No print jobs yet.</p>}
          </div>
        </aside>
      </div>
    </div>
  );
}
