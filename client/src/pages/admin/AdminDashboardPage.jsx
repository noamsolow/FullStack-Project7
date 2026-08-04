import { useCallback } from "react";
import { Link } from "react-router-dom";
import { Icon } from "../../components/ui/Icon.jsx";
import { ErrorState, LoadingState } from "../../components/ui/PageState.jsx";
import { StatusChip } from "../../components/ui/StatusChip.jsx";
import { useApiResource } from "../../hooks/useApiResource.js";
import { adminService } from "../../services/portals/adminService.js";

export function AdminDashboardPage() {
  const load = useCallback(async () => {
    const [users, vendors, maintenance, audit] = await Promise.all([
      adminService.users({ limit: 6 }),
      adminService.vendors({ limit: 6 }),
      adminService.maintenance({ limit: 6 }),
      adminService.audit({ limit: 6 }),
    ]);
    return { users, vendors, maintenance, audit };
  }, []);
  const { data, loading, error, reload } = useApiResource(load);
  if (loading) return <LoadingState label="Opening campus operations..." />;
  if (error) return <ErrorState error={error} onRetry={reload} />;

  const activeTickets = data.maintenance.data.filter((ticket) => !["closed", "rejected"].includes(ticket.status));
  const urgentTickets = activeTickets.filter((ticket) => ticket.priority === "urgent");
  return (
    <div className="portal-page">
      <header className="portal-heading"><div><span className="eyebrow">Campus operations</span><h1>LevGo control center</h1><p>Identity, vendors, maintenance, and audit visibility.</p></div><StatusChip status="active" /></header>
      <section className="stat-grid">
        <article><span><Icon name="report" /></span><div><strong>{activeTickets.length}</strong><small>Open among recent tickets</small></div></article>
        <article><span><Icon name="shield" /></span><div><strong>{urgentTickets.length}</strong><small>Urgent among recent tickets</small></div></article>
        <article><span><Icon name="user" /></span><div><strong>{data.users.data.length}{data.users.meta?.hasMore ? "+" : ""}</strong><small>Visible users</small></div></article>
        <article><span><Icon name="shop" /></span><div><strong>{data.vendors.data.filter((item) => item.status === "active").length}</strong><small>Active among recent vendors</small></div></article>
      </section>
      <div className="portal-dashboard-grid">
        <section className="card">
          <div className="card-heading"><div><span className="eyebrow">Priority queue</span><h2>Maintenance</h2></div><Link to="/admin/maintenance">View queue</Link></div>
          <div className="compact-records">
            {activeTickets.slice(0, 6).map((ticket) => (
              <Link to="/admin/maintenance" key={ticket.public_id}><span><strong>{ticket.title}</strong><small>{ticket.building_name} · {ticket.reporter_name}</small></span><StatusChip status={ticket.priority} /></Link>
            ))}
            {!activeTickets.length && <p className="muted">The maintenance queue is clear.</p>}
          </div>
        </section>
        <section className="card">
          <div className="card-heading"><div><span className="eyebrow">Security trail</span><h2>Recent audit events</h2></div><Link to="/admin/audit">View log</Link></div>
          <div className="compact-records">
            {data.audit.data.map((event) => <div key={event.public_id}><span><strong>{event.action}</strong><small>{event.actor_name ?? "System"}</small></span><StatusChip status={event.outcome} /></div>)}
          </div>
        </section>
      </div>
    </div>
  );
}
