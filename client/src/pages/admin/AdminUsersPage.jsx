import { useCallback, useState } from "react";
import { ConfirmDialog } from "../../components/ui/ConfirmDialog.jsx";
import { LoadMoreButton } from "../../components/ui/LoadMoreButton.jsx";
import { PageHeader } from "../../components/ui/PageHeader.jsx";
import { ErrorState, LoadingState } from "../../components/ui/PageState.jsx";
import { StatusChip } from "../../components/ui/StatusChip.jsx";
import { useLoadMoreResource } from "../../hooks/useLoadMoreResource.js";
import { adminService } from "../../services/portals/adminService.js";
import { formatDate, titleCase } from "../../utils/format.js";

export function AdminUsersPage() {
  const [role, setRole] = useState("");
  const [target, setTarget] = useState(null);
  const [actionError, setActionError] = useState(null);
  const load = useCallback(
    ({ page, limit }) => adminService.users({ page, limit, role }),
    [role],
  );
  const users = useLoadMoreResource(load, { pageSize: 10 });

  async function toggle() {
    try {
      await adminService.setUserBlocked(target.public_id, !target.blocked_at);
      setTarget(null);
      users.reload();
    } catch (caught) {
      setActionError(caught);
    }
  }

  return (
    <div className="portal-page">
      <PageHeader eyebrow="Identity" title="Users" description="Suspend or restore access without deleting historical records." actions={<select aria-label="Filter by role" value={role} onChange={(event) => setRole(event.target.value)}><option value="">All roles</option><option value="customer">Customers</option><option value="vendor_manager">Vendor managers</option><option value="admin">Administrators</option></select>} />
      {users.loading && <LoadingState />}
      {users.error && !users.items.length && <ErrorState error={users.error} onRetry={users.reload} />}
      {actionError && <ErrorState error={actionError} />}
      <div className="data-table-wrap">
        <table className="data-table">
          <thead><tr><th>User</th><th>Type</th><th>Joined</th><th>Status</th><th></th></tr></thead>
          <tbody>{users.items.map((user) => (
            <tr key={user.public_id}>
              <td><strong>{user.display_name}</strong><small>{user.email}</small></td>
              <td>{titleCase(user.role)}<small>{user.customer_type ? titleCase(user.customer_type) : "Operational account"}</small></td>
              <td>{formatDate(user.created_at)}</td>
              <td><StatusChip status={user.blocked_at ? "blocked" : "active"} /></td>
              <td className="row-actions"><button onClick={() => setTarget(user)}>{user.blocked_at ? "Restore" : "Suspend"}</button></td>
            </tr>
          ))}</tbody>
        </table>
      </div>
      <LoadMoreButton hasMore={users.meta.hasMore} loading={users.loadingMore} error={users.items.length ? users.error : null} onLoadMore={users.loadMore} />
      <ConfirmDialog
        open={Boolean(target)}
        title={target?.blocked_at ? "Restore this account?" : "Suspend this account?"}
        message={target?.blocked_at ? "The user will be able to sign in again." : "Existing records remain, but protected API access is blocked immediately."}
        confirmLabel={target?.blocked_at ? "Restore access" : "Suspend access"}
        destructive={!target?.blocked_at}
        onCancel={() => setTarget(null)}
        onConfirm={toggle}
      />
    </div>
  );
}
