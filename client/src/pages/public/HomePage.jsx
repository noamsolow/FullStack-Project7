import { Link } from "react-router-dom";
import { LevGoMark } from "../../components/brand/LevGoLogo.jsx";
import { Icon } from "../../components/ui/Icon.jsx";

const services = [
  {
    to: "/services#food",
    icon: "eat",
    label: "Food services",
    title: "Meals between lectures",
    text: "Choose the meat or dairy cafeteria for campus pickup or delivery.",
    className: "service-card--coral",
  },
  {
    to: "/services#office",
    icon: "shop",
    label: "Office services",
    title: "Supplies and printing",
    text: "Find office essentials or send a document through the private print workflow.",
    className: "service-card--violet",
  },
  {
    to: "/services#maintenance",
    icon: "report",
    label: "Maintenance services",
    title: "Report a campus issue",
    text: "Report something broken, missing, or unsafe and track it through resolution.",
    className: "service-card--navy",
  },
];

export function HomePage() {
  return (
    <>
      <section className="hero">
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
            <Link to="/services" className="button button--primary button--large">
              Explore services <Icon name="arrow" />
            </Link>
            <Link to="/recommend" className="button button--glass button--large">
              <Icon name="sparkles" /> Ask LevGo
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

      <section className="home-section">
        <div className="section-heading">
          <span className="eyebrow">One campus. Three service areas.</span>
          <h2>What do you need right now?</h2>
          <p>Start from the service hub, then continue to the workflow for your specific need.</p>
        </div>
        <div className="service-grid">
          {services.map((service) => (
            <Link key={service.to} to={service.to} className={`service-card ${service.className}`}>
              <span className="service-card__icon"><Icon name={service.icon} size={26} /></span>
              <span className="service-card__label">{service.label}</span>
              <h3>{service.title}</h3>
              <p>{service.text}</p>
              <span className="service-card__link">View services <Icon name="arrow" size={18} /></span>
            </Link>
          ))}
        </div>
      </section>

      <section className="campus-strip">
        <div>
          <span className="eyebrow">Built around your day</span>
          <h2>From the cafeterias to the dorms.</h2>
          <p>
            Choose real Lev Campus destinations, see exact building delivery fees,
            and track every step without guessing where your order went.
          </p>
          <Link to="/services" className="text-link">See all campus services <Icon name="arrow" /></Link>
        </div>
        <div className="campus-strip__map" aria-label="Stylized Lev Campus route">
          <span className="map-node map-node--start"><i /><strong>12</strong><small>Sohachevsky</small></span>
          <span className="map-route" />
          <span className="map-node map-node--middle"><i /><strong>22</strong><small>Levi Building</small></span>
          <span className="map-route map-route--two" />
          <span className="map-node map-node--end"><i /><strong>45</strong><small>Sherman B</small></span>
        </div>
      </section>
    </>
  );
}
