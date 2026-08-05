import { Outlet } from "react-router-dom";
import { ShoppingAssistant } from "../components/assistant/ShoppingAssistant.jsx";
import { AppHeader } from "../components/navigation/AppHeader.jsx";
import { MobileNav } from "../components/navigation/MobileNav.jsx";
import { LevGoLogo } from "../components/brand/LevGoLogo.jsx";
import { CustomerOrderProgress } from "../components/orders/CustomerOrderProgress.jsx";

export function PublicLayout() {
  return (
    <div className="site-shell">
      <AppHeader />
      <CustomerOrderProgress />
      <main id="main-content">
        <Outlet />
      </main>
      <footer className="site-footer">
        <div>
          <LevGoLogo compact />
          <p>Campus, handled. Built for Lev Campus.</p>
        </div>
        <p>Food, office, and maintenance services in one secure place.</p>
      </footer>
      <MobileNav />
      <ShoppingAssistant />
    </div>
  );
}

