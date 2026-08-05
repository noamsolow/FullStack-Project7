import { useMemo, useState } from "react";
import { Icon } from "../ui/Icon.jsx";
import { StatusChip } from "../ui/StatusChip.jsx";
import { titleCase } from "../../utils/format.js";

function isPlottable(point) {
  return Number.isFinite(Number(point?.mapX)) && Number.isFinite(Number(point?.mapY));
}

function pointsAttribute(points) {
  return points.map((point) => `${point.mapX},${point.mapY}`).join(" ");
}

export function MaintenanceRouteMap({ route, onManageTicket }) {
  const [selectedBuilding, setSelectedBuilding] = useState(
    route.stops[0]?.campusCode ?? null,
  );
  const mapPointByCode = useMemo(() => {
    const points = new Map();
    route.legs.forEach((leg) => {
      leg.path.forEach((point) => points.set(point.campusCode, point));
    });
    return points;
  }, [route.legs]);
  const selectedStop = route.stops.find(
    (stop) => stop.campusCode === selectedBuilding,
  ) ?? route.stops[0];
  const depot = mapPointByCode.get(route.depotBuilding);
  const stopCodes = new Set(route.stops.map((stop) => stop.campusCode));
  const waypoints = [...mapPointByCode.values()].filter(
    (point) => point.campusCode !== route.depotBuilding
      && !stopCodes.has(point.campusCode)
      && isPlottable(point),
  );

  return (
    <section className="maintenance-route-map" aria-labelledby="maintenance-route-map-title">
      <div className="maintenance-route-map__heading">
        <div>
          <span className="eyebrow">Visual directions</span>
          <h3 id="maintenance-route-map-title">Follow the numbered campus stops</h3>
        </div>
        <div className="maintenance-route-map__legend" aria-label="Map legend">
          <span><i className="is-route" /> Walking route</span>
          <span><i className="is-stairs" /> Stairs</span>
          <span><i className="is-stop" /> Work stop</span>
        </div>
      </div>

      <div className="maintenance-route-map__canvas">
        <img src="/campus-map.png" alt="Aerial campus map with the recommended maintenance route" />
        <svg
          className="maintenance-route-map__overlay"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <defs>
            <marker id="maintenance-route-arrow" markerWidth="2.8" markerHeight="2.8" refX="2.25" refY="1.4" orient="auto" markerUnits="userSpaceOnUse">
              <path d="M0,0 L2.8,1.4 L0,2.8 Z" className="maintenance-route-map__arrow" />
            </marker>
          </defs>

          {route.legs.map((leg, index) => {
            const path = leg.path.filter(isPlottable);
            if (path.length < 2) return null;
            return (
              <g key={`${leg.from}-${leg.to}-${index}`}>
                <polyline className="maintenance-route-map__route-halo" points={pointsAttribute(path)} />
                <polyline
                  className="maintenance-route-map__route-line"
                  points={pointsAttribute(path)}
                  markerEnd="url(#maintenance-route-arrow)"
                />
              </g>
            );
          })}

          {route.legs.flatMap((leg, legIndex) => leg.segments.map((segment, segmentIndex) => {
            if (Number(segment.stairsDistanceMeters) <= 0) return null;
            const from = mapPointByCode.get(segment.from);
            const to = mapPointByCode.get(segment.to);
            if (!isPlottable(from) || !isPlottable(to)) return null;
            return (
              <line
                key={`stairs-${legIndex}-${segmentIndex}`}
                className="maintenance-route-map__stairs-line"
                x1={from.mapX}
                y1={from.mapY}
                x2={to.mapX}
                y2={to.mapY}
              />
            );
          }))}

          {waypoints.map((point) => (
            <circle
              key={point.campusCode}
              className="maintenance-route-map__waypoint"
              cx={point.mapX}
              cy={point.mapY}
              r=".55"
            />
          ))}
        </svg>

        {isPlottable(depot) && (
          <span
            className="maintenance-route-map__depot"
            style={{ left: `${depot.mapX}%`, top: `${depot.mapY}%` }}
            aria-label={`Maintenance base, building ${route.depotBuilding}`}
          >
            <Icon name="building" size={17} />
            <small>Base {route.depotBuilding}</small>
          </span>
        )}

        {route.stops.map((stop, index) => {
          const point = mapPointByCode.get(stop.campusCode);
          if (!isPlottable(point)) return null;
          const selected = selectedStop?.campusCode === stop.campusCode;
          return (
            <button
              type="button"
              key={stop.campusCode}
              className={`maintenance-route-map__stop${selected ? " is-selected" : ""}`}
              style={{ left: `${point.mapX}%`, top: `${point.mapY}%` }}
              onClick={() => setSelectedBuilding(stop.campusCode)}
              aria-label={`Stop ${index + 1}, building ${stop.campusCode}, ${stop.tickets.length} tasks`}
              aria-pressed={selected}
            >
              {index + 1}
            </button>
          );
        })}
      </div>

      {selectedStop && (
        <div className="maintenance-route-map__details" aria-live="polite">
          <div className="maintenance-route-map__details-title">
            <span>{route.stops.indexOf(selectedStop) + 1}</span>
            <div>
              <strong>Building {selectedStop.campusCode} · {selectedStop.buildingName}</strong>
              <small>{selectedStop.tickets.length} {selectedStop.tickets.length === 1 ? "maintenance task" : "maintenance tasks"} at this stop</small>
            </div>
          </div>
          <div className="maintenance-route-map__task-preview">
            {selectedStop.tickets.map((ticket) => (
              <article key={ticket.public_id}>
                <div>
                  <small>{ticket.ticket_number} · {titleCase(ticket.category)}</small>
                  <strong>{ticket.title}</strong>
                  <span>{ticket.location_text}</span>
                </div>
                <div>
                  <StatusChip status={ticket.priority} />
                  <button type="button" className="text-button" onClick={() => onManageTicket(ticket)}>Manage</button>
                </div>
              </article>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
