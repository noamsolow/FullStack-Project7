import { Link } from "react-router-dom";
import { Icon } from "../components/ui/Icon.jsx";
import { LevGoMark } from "../components/brand/LevGoLogo.jsx";

const services = [
  {
    to: "/eat",
    icon: "eat",
    label: "Eat",
    title: "Lunch between lectures",
    text: "Browse campus kitchens, snacks, and drinks for pickup or building delivery.",
    className: "service-card--coral",
  },
  {
    to: "/shop",
    icon: "shop",
    label: "Shop",
    title: "The supplies you forgot",
    text: "Pens, notebooks, cables, study tools, and dorm essentials—right on campus.",
    className: "service-card--violet",
  },
  {
    to: "/print",
    icon: "print",
    label: "Print",
    title: "Upload. Quote. Collect.",
    text: "Send a private PDF to a campus print point and pay only after review.",
    className: "service-card--cyan",
  },
  {
    to: "/report",
    icon: "report",
    label: "Report",
    title: "Help campus work better",
    text: "Report something broken, missing, or unsafe and follow its progress.",
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
            Food, study supplies, private printing, and campus support—
            one clear place for the moments between everything else.
          </p>
          <div className="hero__actions">
            <Link to="/eat" className="button button--primary button--large">
              Explore LevGo <Icon name="arrow" />
            </Link>
            <Link to="/recommend" className="button button--glass button--large">
              <Icon name="sparkles" /> Ask LevGo
            </Link>
          </div>
          <div className="hero__proof">
            <span><Icon name="shield" /> Secure checkout</span>
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
            <div><strong>Order ready</strong><small>Student Center · pickup</small></div>
          </div>
          <div className="floating-card floating-card--print">
            <span className="floating-card__icon floating-card__icon--cyan">A4</span>
            <div><strong>Print quoted</strong><small>Review before payment</small></div>
          </div>
        </div>
      </section>

      <section className="home-section">
        <div className="section-heading">
          <span className="eyebrow">One campus. Four shortcuts.</span>
          <h2>What do you need right now?</h2>
          <p>Each service has its own safe workflow, joined by one familiar experience.</p>
        </div>
        <div className="service-grid">
          {services.map((service) => (
            <Link key={service.to} to={service.to} className={`service-card ${service.className}`}>
              <span className="service-card__icon"><Icon name={service.icon} size={26} /></span>
              <span className="service-card__label">{service.label}</span>
              <h3>{service.title}</h3>
              <p>{service.text}</p>
              <span className="service-card__link">Open {service.label} <Icon name="arrow" size={18} /></span>
            </Link>
          ))}
        </div>
      </section>

      <section className="campus-strip">
        <div>
          <span className="eyebrow">Built around your day</span>
          <h2>From Canada Hall to the dorms.</h2>
          <p>
            Choose real Lev Campus destinations, see exact building delivery fees,
            and track every step without guessing where your order went.
          </p>
          <Link to="/shop" className="text-link">See campus essentials <Icon name="arrow" /></Link>
        </div>
        <div className="campus-strip__map" aria-label="Stylized Lev Campus route">
          <span className="map-node map-node--start"><i /><strong>12</strong><small>Student Center</small></span>
          <span className="map-route" />
          <span className="map-node map-node--middle"><i /><strong>23</strong><small>Samson Academic</small></span>
          <span className="map-route map-route--two" />
          <span className="map-node map-node--end"><i /><strong>45</strong><small>Residence Hall</small></span>
        </div>
      </section>
    </>
  );
}

