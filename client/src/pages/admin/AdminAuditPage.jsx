import { useCallback, useState } from "react";
import { PageHeader } from "../../components/ui/PageHeader.jsx";
import { LoadMoreButton } from "../../components/ui/LoadMoreButton.jsx";
import { EmptyState, ErrorState, LoadingState } from "../../components/ui/PageState.jsx";
import { StatusChip } from "../../components/ui/StatusChip.jsx";
import { useDebouncedValue } from "../../hooks/useDebouncedValue.js";
import { useLoadMoreResource } from "../../hooks/useLoadMoreResource.js";
import { adminService } from "../../services/portals/adminService.js";
import { formatDate, titleCase } from "../../utils/format.js";

export function AdminAuditPage() {
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebouncedValue(query);
  const load = useCallback(
    ({ page, limit }) => adminService.audit({ page, limit, query: debouncedQuery }),
    [debouncedQuery],
  );
  const audit = useLoadMoreResource(load, { pageSize: 10 });
  return (
    <div className="portal-page">
      <PageHeader eyebrow="Security and system activity" title="System audit log" description="Sign-ins, sign-outs, account activity, and security-relevant system actions." actions={<label className="compact-search"><span className="sr-only">Search audit log</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search action, actor, or resource" /></label>} />
      {audit.loading && <LoadingState />}
      {audit.error && !audit.items.length && <ErrorState error={audit.error} onRetry={audit.reload} />}
      {!audit.loading && !audit.error && !audit.items.length && <EmptyState icon="shield" title="No audit events" message="No events match this exact action filter." />}
      <div className="data-table-wrap">
        <table className="data-table">
          <thead><tr><th>Action</th><th>Actor</th><th>Resource</th><th>Outcome</th><th>Time</th></tr></thead>
          <tbody>{audit.items.map((event) => (
            <tr key={event.public_id}>
              <td><strong>{event.action}</strong><small>{event.summary ?? "Recorded operation"}</small></td>
              <td>{event.actor_name ?? "System"}</td>
              <td>{titleCase(event.resource_type)}<small>{event.resource_public_id ?? "—"}</small></td>
              <td><StatusChip status={event.outcome} /></td>
              <td>{formatDate(event.created_at)}</td>
            </tr>
          ))}</tbody>
        </table>
      </div>
      <LoadMoreButton hasMore={audit.meta.hasMore} loading={audit.loadingMore} error={audit.items.length ? audit.error : null} onLoadMore={audit.loadMore} />
    </div>
  );
}
