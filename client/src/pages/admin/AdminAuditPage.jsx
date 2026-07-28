import { useCallback, useState } from "react";
import { PageHeader } from "../../components/ui/PageHeader.jsx";
import { EmptyState, ErrorState, LoadingState } from "../../components/ui/PageState.jsx";
import { StatusChip } from "../../components/ui/StatusChip.jsx";
import { useApiResource } from "../../hooks/useApiResource.js";
import { adminService } from "../../services/portals/adminService.js";
import { formatDate, titleCase } from "../../utils/format.js";

export function AdminAuditPage() {
  const [action, setAction] = useState("");
  const load = useCallback(() => adminService.audit({ limit: 50, action }), [action]);
  const { data, loading, error, reload } = useApiResource(load);
  return (
    <div className="portal-page">
      <PageHeader eyebrow="Security and system activity" title="System audit log" description="Sign-ins, sign-outs, account activity, and security-relevant system actions." actions={<label className="compact-search"><span className="sr-only">Exact action filter</span><input value={action} onChange={(event) => setAction(event.target.value)} placeholder="Exact action, e.g. auth.login" /></label>} />
      {loading && <LoadingState />}
      {error && <ErrorState error={error} onRetry={reload} />}
      {!loading && !error && !data?.data.length && <EmptyState icon="shield" title="No audit events" message="No events match this exact action filter." />}
      <div className="data-table-wrap">
        <table className="data-table">
          <thead><tr><th>Action</th><th>Actor</th><th>Resource</th><th>Outcome</th><th>Time</th></tr></thead>
          <tbody>{data?.data.map((event) => (
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
    </div>
  );
}
