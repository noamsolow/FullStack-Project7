import { Outlet, useNavigate } from "react-router-dom";
import { PortalSidebar } from "../components/navigation/PortalSidebar.jsx";
import { useAuth } from "../features/auth/AuthContext.jsx";

const items = [
  { to: "/admin", icon: "home", label: "Overview", end: true },
  { to: "/admin/orders", icon: "orders", label: "Order logs" },
  { to: "/admin/maintenance", icon: "report", label: "Maintenance" },
  { to: "/admin/users", icon: "user", label: "Users" },
  { to: "/admin/vendors", icon: "shop", label: "Vendors" },
  { to: "/admin/audit", icon: "shield", label: "Audit log" },
];

export function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  return (
    <div className="portal-shell portal-shell--admin">
      <PortalSidebar
        title="Campus administration"
        items={items}
        user={user}
        onLogout={() => {
          logout();
          navigate("/admin/login");
        }}
      />
      <main className="portal-main"><Outlet /></main>
    </div>
  );
}

