import { useCallback } from "react";
import { Link } from "react-router-dom";
import { PageHeader } from "../../components/ui/PageHeader.jsx";
import { LoadMoreButton } from "../../components/ui/LoadMoreButton.jsx";
import { EmptyState, ErrorState, LoadingState } from "../../components/ui/PageState.jsx";
import { StatusChip } from "../../components/ui/StatusChip.jsx";
import { useLoadMoreResource } from "../../hooks/useLoadMoreResource.js";
import { printService } from "../../services/printing/printService.js";
import { formatDate, formatMoney } from "../../utils/format.js";

export function PrintJobsPage() {
  const load = useCallback(
    ({ page, limit }) => printService.list({ page, limit }),
    [],
  );
  const jobs = useLoadMoreResource(load, { pageSize: 6 });
  return (
    <div className="page-container">
      <PageHeader
        eyebrow="Printing"
        title="Your print jobs"
        description="Fixed pricing, preparation, and pickup in one timeline."
        actions={<Link to="/print" className="button button--primary">New print job</Link>}
      />
      {jobs.loading && <LoadingState />}
      {jobs.error && !jobs.items.length && <ErrorState error={jobs.error} onRetry={jobs.reload} />}
      {!jobs.loading && !jobs.error && !jobs.items.length && (
        <EmptyState title="No print jobs yet" message="Upload a PDF when you are ready." />
      )}
      <div className="record-list" aria-live="polite">
        {jobs.items.map((job) => (
          <Link key={job.public_id} to={`/print/${job.public_id}`} className="record-row">
            <span className="record-row__code">{job.job_number}</span>
            <span>
              <strong>{job.vendor_name}</strong>
              <small>
                {[
                  job.paper_size,
                  `${job.copies} ${job.copies === 1 ? "copy" : "copies"}`,
                  job.laminated ? "Laminated" : null,
                  job.spiral_bound ? "Spiral bound" : null,
                  formatDate(job.created_at),
                ].filter(Boolean).join(" · ")}
              </small>
            </span>
            <span>{job.quote_agorot ? formatMoney(job.quote_agorot) : "Calculating price"}</span>
            <StatusChip status={job.status} />
          </Link>
        ))}
      </div>
      <LoadMoreButton
        hasMore={jobs.meta.hasMore}
        loading={jobs.loadingMore}
        error={jobs.items.length ? jobs.error : null}
        onLoadMore={jobs.loadMore}
      />
    </div>
  );
}
