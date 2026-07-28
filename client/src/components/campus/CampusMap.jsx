import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Icon } from "../ui/Icon.jsx";

function vendorLink(vendor) {
  return vendor.vendor_type === "print_center" ? "/print" : `/vendors/${vendor.slug}`;
}

export function CampusMap({
  buildings = [],
  vendors = [],
  selectedBuildingId = "",
  onSelectBuilding,
  title = "Interactive campus map",
}) {
  const [openBuildingId, setOpenBuildingId] = useState(null);
  const vendorsByBuilding = useMemo(() => {
    const grouped = new Map();
    for (const vendor of vendors) {
      const key = String(vendor.building_id);
      grouped.set(key, [...(grouped.get(key) ?? []), vendor]);
    }
    return grouped;
  }, [vendors]);

  const activeBuildingId = openBuildingId
    ?? (selectedBuildingId ? String(selectedBuildingId) : null);
  const activeBuilding = buildings.find(
    (building) => String(building.building_id ?? building.id) === activeBuildingId,
  );
  const activeVendors = activeBuilding
    ? vendorsByBuilding.get(String(activeBuilding.building_id ?? activeBuilding.id)) ?? []
    : [];

  function select(building) {
    const id = String(building.building_id ?? building.id);
    setOpenBuildingId(id);
    onSelectBuilding?.(id);
  }

  return (
    <section className="campus-map-card" aria-label={title}>
      <div className="campus-map-card__heading">
        <span>
          <span className="eyebrow">Campus map</span>
          <h2>{title}</h2>
        </span>
        <span className="campus-map-legend">
          <i className="campus-map-legend__building" /> Building
          <i className="campus-map-legend__vendor" /> Service
        </span>
      </div>
      <div className="campus-map">
        <img src="/campus-map.png" alt="Aerial map of the campus" />
        {buildings
          .filter((building) => building.map_x !== null && building.map_y !== null)
          .map((building) => {
            const id = String(building.building_id ?? building.id);
            const buildingVendors = vendorsByBuilding.get(id) ?? [];
            const isVendor = buildingVendors.length > 0;
            const isSelected = String(selectedBuildingId) === id;
            return (
              <button
                type="button"
                key={id}
                className={[
                  "campus-map__marker",
                  isVendor ? "campus-map__marker--vendor" : "",
                  isSelected ? "campus-map__marker--selected" : "",
                ].filter(Boolean).join(" ")}
                style={{ left: `${building.map_x}%`, top: `${building.map_y}%` }}
                onClick={() => select(building)}
                aria-label={`${building.campus_code}: ${building.building_name ?? building.short_name}${isVendor ? `, ${buildingVendors.length} services` : ""}`}
                aria-pressed={isSelected}
              >
                {isVendor ? <Icon name="shop" size={15} /> : building.campus_code}
              </button>
            );
          })}
      </div>
      {activeBuilding ? (
        <div className="campus-map-popover" aria-live="polite">
          <div>
            <strong>Building {activeBuilding.campus_code}: {activeBuilding.building_name ?? activeBuilding.short_name}</strong>
            <small>{activeBuilding.delivery_hint ?? activeBuilding.description}</small>
          </div>
          {activeVendors.length > 0 && (
            <div className="campus-map-popover__vendors">
              {activeVendors.map((vendor) => (
                <Link key={vendor.public_id ?? vendor.slug} to={vendorLink(vendor)}>
                  <span><strong>{vendor.name}</strong><small>{vendor.description}</small></span>
                  <Icon name="arrow" size={17} />
                </Link>
              ))}
            </div>
          )}
          {onSelectBuilding && (
            <span className="campus-map-popover__selected">
              <Icon name="check" size={17} /> Delivery destination selected
            </span>
          )}
        </div>
      ) : (
        <p className="campus-map-card__hint">
          Select a marker to see the building and the services available there.
        </p>
      )}
    </section>
  );
}
