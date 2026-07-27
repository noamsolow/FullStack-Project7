import { useCallback } from "react";
import { Link } from "react-router-dom";
import { Icon } from "../components/ui/Icon.jsx";
import { ErrorState, LoadingState } from "../components/ui/PageState.jsx";
import { StatusChip } from "../components/ui/StatusChip.jsx";
import { useApiResource } from "../hooks/useApiResource.js";
import { partnerService } from "../services/partnerService.js";
import { formatMoney } from "../utils/format.js";

export function PartnerDashboardPage() {
  const load = useCallback(async () => {
    const vendor = await partnerService.vendor();
    const [products, orders, printJobs] = await Promise.all([
      partnerService.products({ limit: 50 }),
      partnerService.orders({ limit: 50 }),
      vendor.data.vendor_type === "print_center"
        ? partnerService.printJobs({ limit: 50 })
        : Promise.resolve({ data: [] }),
    ]);
    return { vendor: vendor.data, products: products.data, orders: orders.data, printJobs: printJobs.data };
  }, []);
  const { data, loading, error, reload } = useApiResource(load);
  if (loading) return <LoadingState label="Opening partner workspace..." />;
  if (error) return <ErrorState error={error} onRetry={reload} />;

  const liveOrders = data.orders.filter((item) => !["completed", "cancelled"].includes(item.status));
  const openPrints = data.printJobs.filter((item) => !["completed", "cancelled", "rejected"].includes(item.status));
  const revenue = data.orders
    .filter((item) => item.status !== "cancelled")
    .reduce((sum, item) => sum + item.total_agorot, 0);

  return (
    <div className="portal-page">
      <header className="portal-heading">
        <div><span className="eyebrow">Partner overview</span><h1>Good to see you.</h1><p>{data.vendor.name} · {data.vendor.building_name}</p></div>
        <StatusChip status={data.vendor.is_open ? "open" : "closed"} />
      </header>
      <section className="stat-grid">
        <article><span><Icon name="orders" /></span><div><strong>{liveOrders.length}</strong><small>Active orders</small></div></article>
        <article><span><Icon name={data.vendor.vendor_type === "print_center" ? "print" : "building"} /></span><div><strong>{data.vendor.vendor_type === "print_center" ? openPrints.length : data.vendor.deliveryZones.length}</strong><small>{data.vendor.vendor_type === "print_center" ? "Open print jobs" : "Delivery zones"}</small></div></article>
        <article><span><Icon name="shop" /></span><div><strong>{data.products.length}</strong><small>Products</small></div></article>
        <article><span><Icon name="shield" /></span><div><strong>{formatMoney(revenue)}</strong><small>Visible order value</small></div></article>
      </section>
      <div className="portal-dashboard-grid">
        <section className="card">
          <div className="card-heading"><div><span className="eyebrow">Needs attention</span><h2>Recent orders</h2></div><Link to="/partner/orders">View all</Link></div>
          <div className="compact-records">
            {liveOrders.slice(0, 5).map((order) => (
              <Link to="/partner/orders" key={order.public_id}>
                <span><strong>{order.order_number}</strong><small>{order.customer_name}</small></span>
                <StatusChip status={order.status} />
              </Link>
            ))}
            {!liveOrders.length && <p className="muted">No active orders.</p>}
          </div>
        </section>
        <section className="card">
          <div className="card-heading"><div><span className="eyebrow">Quick actions</span><h2>Run your storefront</h2></div></div>
          <div className="quick-actions">
            <Link to="/partner/products"><Icon name="plus" /><span><strong>Add a product</strong><small>Price, stock, and availability</small></span></Link>
            {data.vendor.vendor_type === "print_center"
              ? <Link to="/partner/print-jobs"><Icon name="print" /><span><strong>Review print jobs</strong><small>Download privately and send quotes</small></span></Link>
              : <Link to="/partner/orders"><Icon name="orders" /><span><strong>Manage orders</strong><small>Accept, prepare, and complete</small></span></Link>}
            <Link to="/partner/settings"><Icon name="building" /><span><strong>Delivery settings</strong><small>Fees and campus zones</small></span></Link>
          </div>
        </section>
      </div>
    </div>
  );
}
