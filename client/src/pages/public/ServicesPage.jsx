import { useCallback, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { CampusMap } from "../../components/campus/CampusMap.jsx";
import { Icon } from "../../components/ui/Icon.jsx";
import { PageHeader } from "../../components/ui/PageHeader.jsx";
import { ErrorState, LoadingState } from "../../components/ui/PageState.jsx";
import { useApiResource } from "../../hooks/useApiResource.js";
import { catalogService } from "../../services/catalog/catalogService.js";

const groups = [
  {
    id: "food",
    icon: "eat",
    eyebrow: "Food services",
    title: "Meals for the campus day",
    description: "Order from the meat or dairy cafeteria for pickup or delivery to an active campus building.",
    theme: "coral",
    services: [
      {
        to: "/vendors/meat-cafeteria",
        title: "Meat Cafeteria",
        detail: "Meat meals, sandwiches, cold drinks, pickup, and delivery.",
        meta: "Building 12",
      },
      {
        to: "/vendors/dairy-cafeteria",
        title: "Dairy Cafeteria",
        detail: "Toast, pasta, salads, yogurt, coffee, pickup, and delivery.",
        meta: "Building 12",
      },
    ],
    browse: { to: "/eat", label: "Browse all food services" },
  },
  {
    id: "office",
    icon: "shop",
    eyebrow: "Office services",
    title: "Study, print, and document essentials",
    description: "Get office supplies or send a document through the dedicated private printing workflow.",
    theme: "violet",
    services: [
      {
        to: "/vendors/office-supplies",
        title: "Office Supplies Store",
        detail: "Pens, notebooks, paper, highlighters, and storage devices.",
        meta: "Building 22",
      },
      {
        to: "/print",
        title: "Print Center",
        detail: "Upload a PDF, receive a quote, approve it, and collect the finished job.",
        meta: "Building 26",
      },
    ],
    browse: { to: "/shop", label: "Browse office products" },
  },
  {
    id: "maintenance",
    icon: "report",
    eyebrow: "Maintenance services",
    title: "Report a campus issue",
    description: "Open a structured maintenance request and follow its status until the campus team resolves it.",
    theme: "navy",
    services: [
      {
        to: "/report",
        title: "Maintenance Requests",
        detail: "Report electrical, plumbing, furniture, cleaning, safety, IT, or supply issues.",
        meta: "All campus buildings",
      },
    ],
  },
];

export function ServicesPage() {
  const location = useLocation();
  const loadMap = useCallback(async () => {
    const [buildings, vendors] = await Promise.all([
      catalogService.buildings({ limit: 50 }),
      catalogService.vendors({ limit: 50 }),
    ]);
    return { buildings: buildings.data, vendors: vendors.data };
  }, []);
  const map = useApiResource(loadMap, [loadMap]);
  useEffect(() => {
    if (!location.hash) return;
    document.querySelector(location.hash)?.scrollIntoView({ behavior: "smooth" });
  }, [location.hash]);

  return (
    <div className="page-container services-page">
      <PageHeader
        eyebrow="Campus services"
        title="What can we handle for you?"
        description="Choose a service area, then continue to the focused workflow for that specific campus need."
      />
      <nav className="services-jump-nav" aria-label="Service areas">
        {groups.map((group) => (
          <a key={group.id} href={`#${group.id}`}>
            <Icon name={group.icon} size={18} /> {group.eyebrow}
          </a>
        ))}
      </nav>
      {map.loading ? (
        <LoadingState />
      ) : map.error ? (
        <ErrorState error={map.error} onRetry={map.reload} />
      ) : (
        <CampusMap
          buildings={map.data.buildings}
          vendors={map.data.vendors}
          title="Find campus services"
        />
      )}
      <div className="services-hub">
        {groups.map((group) => (
          <section
            className={`services-group services-group--${group.theme}`}
            id={group.id}
            key={group.id}
          >
            <header>
              <span className="services-group__icon"><Icon name={group.icon} size={27} /></span>
              <div>
                <span className="eyebrow">{group.eyebrow}</span>
                <h2>{group.title}</h2>
                <p>{group.description}</p>
              </div>
            </header>
            <div className="services-group__links">
              {group.services.map((service) => (
                <Link key={service.to} to={service.to} className="service-route-card">
                  <span>
                    <strong>{service.title}</strong>
                    <small>{service.meta}</small>
                  </span>
                  <p>{service.detail}</p>
                  <span className="service-route-card__action">
                    Open service <Icon name="arrow" size={18} />
                  </span>
                </Link>
              ))}
            </div>
            {group.browse && (
              <Link className="services-group__browse" to={group.browse}>
                {group.browse.label} <Icon name="arrow" size={18} />
              </Link>
            )}
          </section>
        ))}
      </div>
    </div>
  );
}
