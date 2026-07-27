import { useCallback } from "react";
import { Link } from "react-router-dom";
import { PageHeader } from "../../../components/ui/PageHeader.jsx";
import { EmptyState, ErrorState, LoadingState } from "../../../components/ui/PageState.jsx";
import { StatusChip } from "../../../components/ui/StatusChip.jsx";
import { useApiResource } from "../../../hooks/useApiResource.js";
import { orderService } from "../../../services/commerce/orderService.js";
import { formatDate, formatMoney, titleCase } from "../../../utils/format.js";

export function OrdersPage() {
  const load = useCallback(() => orderService.list({ limit: 30 }), []);
  const { data, loading, error, reload } = useApiResource(load);
  const orders = data?.data ?? [];

  return (
    <div className="page-container">
      <PageHeader
        eyebrow="Orders"
        title="Everything you ordered"
        description="Track payment, preparation, pickup, and campus delivery."
        actions={<Link className="button button--primary" to="/eat">Start an order</Link>}
      />
      {loading && <LoadingState label="Loading your orders..." />}
      {error && <ErrorState error={error} onRetry={reload} />}
      {!loading && !error && orders.length === 0 && (
        <EmptyState
          icon="orders"
          title="No orders yet"
          message="Your first food or campus-supply order will appear here."
          action={<Link className="button button--primary" to="/shop">Browse campus supplies</Link>}
        />
      )}
      <div className="record-list">
        {orders.map((order) => (
          <Link className="record-row" key={order.public_id} to={`/orders/${order.public_id}`}>
            <span className="record-row__code">{order.order_number}</span>
            <span>
              <strong>{order.vendor_name}</strong>
              <small>{titleCase(order.fulfillment_type)} · {formatDate(order.created_at)}</small>
            </span>
            <strong>{formatMoney(order.total_agorot, order.currency)}</strong>
            <StatusChip status={order.status} />
          </Link>
        ))}
      </div>
    </div>
  );
}
