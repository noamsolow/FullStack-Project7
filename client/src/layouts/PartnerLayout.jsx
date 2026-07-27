import { Outlet, useNavigate } from "react-router-dom";
import { PortalSidebar } from "../components/navigation/PortalSidebar.jsx";
import { useAuth } from "../features/auth/AuthContext.jsx";

const items = [
  { to: "/partner", icon: "home", label: "Overview", end: true },
  { to: "/partner/products", icon: "shop", label: "Products" },
  { to: "/partner/orders", icon: "orders", label: "Orders" },
  { to: "/partner/print-jobs", icon: "print", label: "Print jobs" },
  { to: "/partner/settings", icon: "building", label: "Vendor settings" },
];

export function PartnerLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const visibleItems = user?.vendor?.type === "print_center"
    ? items
    : items.filter((item) => item.to !== "/partner/print-jobs");
  return (
    <div className="portal-shell">
      <PortalSidebar
        title="Partner workspace"
        items={visibleItems}
        user={user}
        onLogout={() => {
          logout();
          navigate("/partner/login");
        }}
      />
      <main className="portal-main"><Outlet /></main>
    </div>
  );
}
