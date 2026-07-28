import { Link } from "react-router-dom";
import { LevGoMark } from "../../components/brand/LevGoLogo.jsx";
import { Icon } from "../../components/ui/Icon.jsx";
import { useAuth } from "../../features/auth/AuthContext.jsx";

export function HomePage() {
  const { user } = useAuth();

  return (
    <section className="hero hero--compact">
      <div className="hero__glow hero__glow--one" />
      <div className="hero__glow hero__glow--two" />
      <div className="hero__content">
        <span className="hero__badge"><i /> Made for Lev Campus</span>
        <h1>Campus life,<br /><em>handled.</em></h1>
        <p>
          Food, office, printing, and campus maintenance services—
          one clear place for the moments between everything else.
        </p>
        <div className="hero__actions">
          <Link
            to={user ? "/orders" : "/login"}
            className="button button--primary button--large"
          >
            {user ? "View my orders" : "Sign in to get started"} <Icon name="arrow" />
          </Link>
        </div>
        <div className="hero__proof">
          <span><Icon name="shield" /> Server-verified orders</span>
          <span><Icon name="building" /> Campus-only delivery</span>
        </div>
      </div>
      <div className="hero__art" aria-hidden="true">
        <div className="orbit orbit--outer">
          <span className="orbit-item orbit-item--food">🥙</span>
          <span className="orbit-item orbit-item--pen">✏️</span>
          <span className="orbit-item orbit-item--print">📄</span>
        </div>
        <div className="orbit orbit--inner" />
        <div className="hero-mark"><LevGoMark size={150} /></div>
        <div className="floating-card floating-card--order">
          <span className="floating-card__icon">✓</span>
          <div><strong>Order ready</strong><small>Sohachevsky Building · pickup</small></div>
        </div>
        <div className="floating-card floating-card--print">
          <span className="floating-card__icon floating-card__icon--cyan">A4</span>
          <div><strong>Print quoted</strong><small>Review before approval</small></div>
        </div>
      </div>
    </section>
  );
}
