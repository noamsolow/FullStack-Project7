import { NavLink } from "react-router-dom";
import { useAuth } from "../../features/auth/AuthContext.jsx";
import { Icon } from "../ui/Icon.jsx";

const items = [
  { to: "/", icon: "home", label: "Home", end: true },
  { to: "/eat", icon: "eat", label: "Eat" },
  { to: "/shop", icon: "shop", label: "Shop" },
  { to: "/print", icon: "print", label: "Print" },
  { to: "/report", icon: "report", label: "Report" },
];

export function MobileNav() {
  const { user } = useAuth();
  const visibleItems = user
    ? [...items, { to: "/orders", icon: "orders", label: "Orders" }]
    : items;
  return (
    <nav className="mobile-nav" aria-label="Mobile navigation">
      {visibleItems.map((item) => (
        <NavLink key={item.to} to={item.to} end={item.end}>
          <Icon name={item.icon} />
          <span>{item.label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
