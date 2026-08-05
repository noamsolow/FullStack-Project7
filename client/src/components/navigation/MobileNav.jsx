import { NavLink } from "react-router-dom";
import { useAuth } from "../../features/auth/AuthContext.jsx";
import { Icon } from "../ui/Icon.jsx";

const items = [
  { to: "/", icon: "home", label: "Home", end: true },
  { to: "/services", icon: "shop", label: "Services" },
];

export function MobileNav() {
  const { user, checking } = useAuth();
  const visibleItems = !checking && user?.role === "customer"
    ? [
      ...items,
      { to: "/cart", icon: "cart", label: "Cart" },
      { to: "/orders", icon: "orders", label: "Orders" },
      { to: "/account", icon: "user", label: "Account" },
    ]
    : [...items, { to: "/login", icon: "user", label: "Sign in" }];
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
