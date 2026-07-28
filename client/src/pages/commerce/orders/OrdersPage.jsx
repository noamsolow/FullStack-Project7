import { useCallback } from "react";
import { Link } from "react-router-dom";
import { PageHeader } from "../../../components/ui/PageHeader.jsx";
import { EmptyState, ErrorState, LoadingState } from "../../../components/ui/PageState.jsx";
import { StatusChip } from "../../../components/ui/StatusChip.jsx";
import { useApiResource } from "../../../hooks/useApiResource.js";
import { orderService } from "../../../services/commerce/orderService.js";
import { printService } from "../../../services/printing/printService.js";
import { formatDate, formatMoney, titleCase } from "../../../utils/format.js";

export function OrdersPage() {
  const load = useCallback(async () => {
    const [orders, printJobs] = await Promise.all([
      orderService.list({ limit: 30 }),
      printService.list({ limit: 30 }),
    ]);
    return { orders: orders.data, printJobs: printJobs.data };
  }, []);
  const { data, loading, error, reload } = useApiResource(load);
  const orders = data?.orders ?? [];
  const printJobs = data?.printJobs ?? [];

  return (
    <div className="page-container">
      <PageHeader
        eyebrow="Orders"
        title="Everything you requested"
        description="Track product orders and private print jobs in one place."
        actions={<Link className="button button--primary" to="/services">Open services</Link>}
      />
      {loading && <LoadingState label="Loading your orders..." />}
      {error && <ErrorState error={error} onRetry={reload} />}
      {!loading && !error && orders.length === 0 && printJobs.length === 0 && (
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
        </section>
      )}
    </div>
  );
}
