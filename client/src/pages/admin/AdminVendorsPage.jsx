import { useCallback, useState } from "react";
import { ConfirmDialog } from "../../components/ui/ConfirmDialog.jsx";
import { LoadMoreButton } from "../../components/ui/LoadMoreButton.jsx";
import { PageHeader } from "../../components/ui/PageHeader.jsx";
import { ErrorState, LoadingState } from "../../components/ui/PageState.jsx";
import { StatusChip } from "../../components/ui/StatusChip.jsx";
import { useLoadMoreResource } from "../../hooks/useLoadMoreResource.js";
import { adminService } from "../../services/portals/adminService.js";
import { formatDate, titleCase } from "../../utils/format.js";

export function AdminVendorsPage() {
  const [type, setType] = useState("");
  const [target, setTarget] = useState(null);
  const [actionError, setActionError] = useState(null);
  const load = useCallback(
    ({ page, limit }) => adminService.vendors({ page, limit, type }),
    [type],
  );
  const vendors = useLoadMoreResource(load, { pageSize: 10 });

  async function toggle() {
    try {
      await adminService.setVendorStatus(target.public_id, target.status === "active" ? "suspended" : "active");
      setTarget(null);
      vendors.reload();
    } catch (caught) {
      setActionError(caught);
    }
  }

  return (
    <div className="portal-page">
      <PageHeader eyebrow="Partners" title="Vendors" description="Review and suspend campus storefronts and print centers." actions={<select aria-label="Filter vendor type" value={type} onChange={(event) => setType(event.target.value)}><option value="">All types</option>{["food_court", "campus_shop", "vending_machine", "print_center"].map((value) => <option key={value} value={value}>{titleCase(value)}</option>)}</select>} />
      {vendors.loading && <LoadingState />}
      {vendors.error && !vendors.items.length && <ErrorState error={vendors.error} onRetry={vendors.reload} />}
      {actionError && <ErrorState error={actionError} />}
      <div className="data-table-wrap">
        <table className="data-table">
          <thead><tr><th>Vendor</th><th>Type</th><th>Location</th><th>Service</th><th>Status</th><th></th></tr></thead>
          <tbody>{vendors.items.map((vendor) => (
            <tr key={vendor.public_id}>
              <td><strong>{vendor.name}</strong><small>{vendor.contact_email} · {formatDate(vendor.created_at)}</small></td>
              <td>{titleCase(vendor.vendor_type)}</td>
              <td>{vendor.building_name}</td>
              <td>{vendor.delivery_enabled ? "Pickup + delivery" : "Pickup only"}</td>
              <td><StatusChip status={vendor.status} /></td>
              <td className="row-actions"><button onClick={() => setTarget(vendor)}>{vendor.status === "active" ? "Suspend" : "Restore"}</button></td>
            </tr>
          ))}</tbody>
        </table>
      </div>
      <LoadMoreButton hasMore={vendors.meta.hasMore} loading={vendors.loadingMore} error={vendors.items.length ? vendors.error : null} onLoadMore={vendors.loadMore} />
      <ConfirmDialog
        open={Boolean(target)}
        title={target?.status === "active" ? "Suspend this vendor?" : "Restore this vendor?"}
        message={target?.status === "active" ? "Managers lose protected vendor access and customers cannot transact with the storefront." : "The storefront and manager access will become available again."}
        confirmLabel={target?.status === "active" ? "Suspend vendor" : "Restore vendor"}
        destructive={target?.status === "active"}
        onCancel={() => setTarget(null)}
        onConfirm={toggle}
      />
    </div>
  );
}
