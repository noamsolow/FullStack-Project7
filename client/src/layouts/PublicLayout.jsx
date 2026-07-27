import { Outlet } from "react-router-dom";
import { AppHeader } from "../components/navigation/AppHeader.jsx";
import { MobileNav } from "../components/navigation/MobileNav.jsx";
import { LevGoLogo } from "../components/brand/LevGoLogo.jsx";

export function PublicLayout() {
  return (
    <div className="site-shell">
      <AppHeader />
      <main id="main-content">
        <Outlet />
      </main>
      <footer className="site-footer">
        <div>
          <LevGoLogo compact />
          <p>Campus, handled. Built for Lev Campus.</p>
        </div>
        <p>Food, supplies, printing, and campus support in one secure place.</p>
      </footer>
      <MobileNav />
    </div>
  );
}

