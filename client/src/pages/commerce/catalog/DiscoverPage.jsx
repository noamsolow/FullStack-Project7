import { useCallback, useState } from "react";
import { Link } from "react-router-dom";
import { Icon } from "../../../components/ui/Icon.jsx";
import { PageHeader } from "../../../components/ui/PageHeader.jsx";
import { EmptyState, ErrorState, LoadingState } from "../../../components/ui/PageState.jsx";
import { useApiResource } from "../../../hooks/useApiResource.js";
import { catalogService } from "../../../services/catalog/catalogService.js";

const typeVisuals = {
  food_court: ["🥗", "vendor-card--coral"],
  campus_shop: ["✏️", "vendor-card--violet"],
  vending_machine: ["🥤", "vendor-card--cyan"],
  print_center: ["📄", "vendor-card--navy"],
};

export function DiscoverPage({ group }) {
  const [query, setQuery] = useState("");
  const [openOnly, setOpenOnly] = useState(false);
  const [buildingId, setBuildingId] = useState("");
  const [service, setService] = useState("");
  const load = useCallback(
    () => catalogService.vendors({
      group,
      query,
      buildingId,
      pickup: service === "pickup" || undefined,
      delivery: service === "delivery" || undefined,
      limit: 24,
    }),
    [buildingId, group, query, service],
  );
  const loadBuildings = useCallback(() => catalogService.buildings({ limit: 50 }), []);
  const { data, loading, error, reload } = useApiResource(load, [load]);
  const buildings = useApiResource(loadBuildings);
  const title = group === "eat" ? "Food for the next break" : "Campus essentials, close by";
  const description = group === "eat"
    ? "Fresh meals, snacks, and drinks for pickup or campus delivery."
    : "Stationery, technology, study tools, and dorm essentials without leaving campus.";
  const visible = (data?.data ?? []).filter((vendor) => !openOnly || vendor.is_open);

  return (
    <div className="page-container discover-page">
      <PageHeader
        eyebrow={group === "eat" ? "Eat on campus" : "Shop on campus"}
        title={title}
        description={description}
      />
      <section className="filter-bar" aria-label="Vendor filters">
        <label className="search-field">
          <Icon name="search" />
          <span className="sr-only">Search vendors</span>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={group === "eat" ? "Search meals or vendors" : "Search supplies or shops"}
          />
        </label>
        <label className="compact-filter">
          <span className="sr-only">Building</span>
          <select value={buildingId} onChange={(event) => setBuildingId(event.target.value)}>
            <option value="">All buildings</option>
            {buildings.data?.data.map((building) => <option key={building.id} value={building.id}>{building.short_name}</option>)}
          </select>
        </label>
        <label className="compact-filter">
          <span className="sr-only">Service</span>
          <select value={service} onChange={(event) => setService(event.target.value)}>
            <option value="">Pickup or delivery</option>
            <option value="pickup">Pickup</option>
            <option value="delivery">Delivery</option>
          </select>
        </label>
        <label className="toggle">
          <input type="checkbox" checked={openOnly} onChange={(event) => setOpenOnly(event.target.checked)} />
          <span /> Open now
        </label>
      </section>

      {loading && <LoadingState label="Finding campus options..." />}
      {error && <ErrorState error={error} onRetry={reload} />}
      {!loading && !error && visible.length === 0 && (
        <EmptyState
          title="No matches yet"
          message="Try a broader search or include vendors that are currently closed."
        />
      )}
      <section className="vendor-grid" aria-live="polite">
        {visible.map((vendor) => {
          const [emoji, className] = typeVisuals[vendor.vendor_type] ?? ["🏪", "vendor-card--violet"];
          return (
            <Link key={vendor.public_id} to={`/vendors/${vendor.slug}`} className={`vendor-card ${className}`}>
              <div className="vendor-card__visual">
                <span>{emoji}</span>
                <i className="vendor-card__shape" />
                <em className={vendor.is_open ? "open" : "closed"}>
                  {vendor.is_open ? "Open" : "Closed"}
                </em>
              </div>
              <div className="vendor-card__body">
                <span className="vendor-card__location"><Icon name="building" size={16} /> {vendor.building_name}</span>
                <h2>{vendor.name}</h2>
                <p>{vendor.description}</p>
                <div className="vendor-card__meta">
                  <span><Icon name="clock" size={16} /> {vendor.estimated_min_minutes}–{vendor.estimated_max_minutes} min</span>
                  <span>{vendor.delivery_enabled ? "Pickup + delivery" : "Pickup"}</span>
                </div>
              </div>
            </Link>
          );
        })}
      </section>
    </div>
  );
}
