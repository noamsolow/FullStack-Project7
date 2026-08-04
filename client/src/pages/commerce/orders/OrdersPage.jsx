import { useCallback } from "react";
import { Link } from "react-router-dom";
import { PageHeader } from "../../../components/ui/PageHeader.jsx";
import { LoadMoreButton } from "../../../components/ui/LoadMoreButton.jsx";
import { EmptyState, ErrorState, LoadingState } from "../../../components/ui/PageState.jsx";
import { StatusChip } from "../../../components/ui/StatusChip.jsx";
import { useLoadMoreResource } from "../../../hooks/useLoadMoreResource.js";
import { orderService } from "../../../services/commerce/orderService.js";
import { printService } from "../../../services/printing/printService.js";
import { formatDate, formatMoney, titleCase } from "../../../utils/format.js";

export function OrdersPage() {
  const loadOrders = useCallback(
    ({ page, limit }) => orderService.list({ page, limit }),
    [],
  );
  const loadPrintJobs = useCallback(
    ({ page, limit }) => printService.list({ page, limit }),
    [],
  );
  const orderHistory = useLoadMoreResource(loadOrders, { pageSize: 6 });
  const printHistory = useLoadMoreResource(loadPrintJobs, { pageSize: 6 });
  const orders = orderHistory.items;
  const printJobs = printHistory.items;
  const loading = orderHistory.loading || printHistory.loading;

  return (
    <div className="page-container">
      <PageHeader
        eyebrow="Orders"
        title="Everything you requested"
        description="Track product orders and private print jobs in one place."
        actions={<Link className="button button--primary" to="/services">Open services</Link>}
      />
      {loading && <LoadingState label="Loading your orders..." />}
      {orderHistory.error && !orders.length && <ErrorState error={orderHistory.error} onRetry={orderHistory.reload} />}
      {printHistory.error && !printJobs.length && <ErrorState error={printHistory.error} onRetry={printHistory.reload} />}
      {!loading && !orderHistory.error && !printHistory.error && orders.length === 0 && printJobs.length === 0 && (
        <EmptyState
          icon="orders"
          title="No orders yet"
          message="Your first product order or print job will appear here."
          action={<Link className="button button--primary" to="/services">Open services</Link>}
        />
      )}

      {printJobs.length > 0 && (
        <section className="record-section">
          <div className="record-section__heading">
            <div><span className="eyebrow">Printing</span><h2>Print jobs</h2></div>
            <Link to="/print/jobs">View print history</Link>
          </div>
          <div className="record-list">
            {printJobs.map((job) => (
              <Link className="record-row" key={job.public_id} to={`/print/${job.public_id}`}>
                <span className="record-row__code">{job.job_number}</span>
                <span>
                  <strong>{job.vendor_name}</strong>
                  <small>{titleCase(job.color_mode)} · {job.copies} {job.copies === 1 ? "copy" : "copies"} · {formatDate(job.created_at)}</small>
                </span>
                <strong>{job.quote_agorot ? formatMoney(job.quote_agorot, job.currency) : "Calculating"}</strong>
                <StatusChip status={job.status} />
              </Link>
            ))}
          </div>
          <LoadMoreButton
            hasMore={printHistory.meta.hasMore}
            loading={printHistory.loadingMore}
            error={printHistory.error}
            onLoadMore={printHistory.loadMore}
          />
        </section>
      )}

      {orders.length > 0 && (
        <section className="record-section">
          <div className="record-section__heading">
            <div><span className="eyebrow">Campus purchases</span><h2>Product orders</h2></div>
          </div>
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
          <LoadMoreButton
            hasMore={orderHistory.meta.hasMore}
            loading={orderHistory.loadingMore}
            error={orderHistory.error}
            onLoadMore={orderHistory.loadMore}
          />
        </section>
      )}
    </div>
  );
}
