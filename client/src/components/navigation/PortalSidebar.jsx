import { NavLink } from "react-router-dom";
import { LevGoLogo } from "../brand/LevGoLogo.jsx";
import { Icon } from "../ui/Icon.jsx";

export function PortalSidebar({ title, items, user, onLogout }) {
  return (
    <aside className="portal-sidebar">
      <LevGoLogo />
      <div className="portal-sidebar__eyebrow">{title}</div>
      <nav aria-label={`${title} navigation`}>
        {items.map((item) => (
          <NavLink key={item.to} to={item.to} end={item.end}>
            <Icon name={item.icon} />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>
      <div className="portal-user">
        <span>{user?.displayName?.slice(0, 1).toUpperCase()}</span>
        <div>
          <strong>{user?.displayName}</strong>
          <small>{user?.email}</small>
        </div>
      </div>
      <button className="sidebar-logout" onClick={onLogout}>
        <Icon name="logout" /> Sign out
      </button>
    </aside>
  );
}

