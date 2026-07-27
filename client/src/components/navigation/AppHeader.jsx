import { Link, NavLink } from "react-router-dom";
import { useAuth } from "../../features/auth/AuthContext.jsx";
import { useCart } from "../../features/cart/CartContext.jsx";
import { LevGoLogo } from "../brand/LevGoLogo.jsx";
import { Icon } from "../ui/Icon.jsx";

const nav = [
  { to: "/", label: "Home", end: true },
  { to: "/eat", label: "Eat" },
  { to: "/shop", label: "Shop" },
  { to: "/print", label: "Print" },
  { to: "/report", label: "Report" },
];

export function AppHeader() {
  const { user } = useAuth();
  const { count } = useCart();
  return (
    <header className="app-header">
      <div className="app-header__inner">
        <Link to="/" className="logo-link" aria-label="LevGo home">
          <LevGoLogo />
        </Link>
        <nav className="desktop-nav" aria-label="Primary">
          {[...nav, ...(user ? [{ to: "/orders", label: "Orders" }] : [])].map((item) => (
            <NavLink key={item.to} to={item.to} end={item.end}>{item.label}</NavLink>
          ))}
        </nav>
        <div className="header-actions">
          <Link to="/cart" className="icon-button cart-button" aria-label={`Cart with ${count} items`}>
            <Icon name="cart" />
            {count > 0 && <span>{count}</span>}
          </Link>
          {user ? (
            <Link to="/account" className="avatar-link" aria-label="Account">
              {user.displayName?.slice(0, 1).toUpperCase()}
            </Link>
          ) : (
            <Link to="/login" className="button button--secondary button--small">Sign in</Link>
          )}
        </div>
      </div>
    </header>
  );
}
