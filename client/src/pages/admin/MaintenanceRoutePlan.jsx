import { useCallback, useState } from "react";
import { MaintenanceRouteMap } from "../../components/campus/MaintenanceRouteMap.jsx";
import { Icon } from "../../components/ui/Icon.jsx";
import { EmptyState, ErrorState, LoadingState } from "../../components/ui/PageState.jsx";
import { StatusChip } from "../../components/ui/StatusChip.jsx";
import { useApiResource } from "../../hooks/useApiResource.js";
import { adminService } from "../../services/portals/adminService.js";
import { titleCase } from "../../utils/format.js";

function roundedWeight(value) {
  return new Intl.NumberFormat("en-IL", { maximumFractionDigits: 1 }).format(value);
}

export function MaintenanceRoutePlan({ onManageTicket }) {
  const [requested, setRequested] = useState(false);

  if (!requested) {
    return (
      <section className="maintenance-route-launch card" aria-labelledby="maintenance-route-launch-title">
        <span className="maintenance-route-launch__icon"><Icon name="route" size={30} /></span>
        <div>
          <span className="eyebrow">Smart campus routing</span>
          <h2 id="maintenance-route-launch-title">Plan a route for the maintenance worker</h2>
          <p>Generate a closed, optimized round through every building that currently has active maintenance work.</p>
        </div>
        <button type="button" className="button button--primary" onClick={() => setRequested(true)}>
          <Icon name="route" size={18} /> Plan maintenance route
        </button>
      </section>
    );
  }

  return (
    <RequestedMaintenanceRoute
      onClose={() => setRequested(false)}
      onManageTicket={onManageTicket}
    />
  );
}

function RequestedMaintenanceRoute({ onClose, onManageTicket }) {
  const [page, setPage] = useState(1);
  const load = useCallback(
    () => adminService.maintenanceRoute({ page, limit: 50 }),
    [page],
  );
  const { data, loading, error, reload } = useApiResource(load);
  const route = data?.data;

  return (
    <section className="maintenance-route card" aria-labelledby="maintenance-route-title">
      <div className="maintenance-route__heading">
        <div>
          <span className="eyebrow">Route optimization</span>
          <h2 id="maintenance-route-title">Recommended maintenance round</h2>
          <p>One closed route through every building with active work, starting and ending at building 37.</p>
        </div>
        <div className="maintenance-route__actions">
          <button
            type="button"
            className="button button--secondary button--small"
            onClick={reload}
            disabled={loading}
          >
            Refresh route
          </button>
          <button type="button" className="button button--ghost button--small" onClick={onClose}>
            Close route
          </button>
        </div>
      </div>

      {loading && <LoadingState label="Calculating the shortest maintenance round..." />}
      {error && <ErrorState error={error} onRetry={reload} />}
      {route && route.ticketCount === 0 && (
        <EmptyState
          icon="check"
          title={route.hasPrevious ? "No more route tasks" : "No active route needed"}
          message={route.hasPrevious
            ? "Return to the previous batch of active maintenance work."
            : "There are no open, acknowledged, or in-progress maintenance tickets."}
        />
      )}
      {route && route.ticketCount > 0 && (
        <RouteResult route={route} onManageTicket={onManageTicket} />
      )}
      {route && (route.hasPrevious || route.hasMore) && (
        <nav className="load-more" aria-label="Maintenance route batches">
          <button
            type="button"
            className="button button--secondary"
            disabled={!route.hasPrevious || loading}
            onClick={() => setPage((current) => Math.max(1, current - 1))}
          >
            Previous 50
          </button>
          <span>Route batch {route.page}</span>
          <button
            type="button"
            className="button button--secondary"
            disabled={!route.hasMore || loading}
            onClick={() => setPage((current) => current + 1)}
          >
            Plan next 50
          </button>
        </nav>
      )}
    </section>
  );
}

function RouteResult({ route, onManageTicket }) {
  const stopByBuilding = new Map(
    route.stops.map((stop) => [stop.campusCode, stop]),
  );

  return (
    <div className="maintenance-route__result" aria-live="polite">
      <div className="maintenance-route__summary">
        <span><strong>{route.ticketCount}</strong><small>Active tasks</small></span>
        <span><strong>{route.stopCount}</strong><small>Campus stops</small></span>
        <span><strong>{roundedWeight(route.totalDistanceMeters)}</strong><small>Walking meters</small></span>
        <span><strong>{roundedWeight(route.totalWeight)}</strong><small>Weighted meters</small></span>
        <span className="maintenance-route__algorithm"><Icon name="route" size={18} /><small>Metric TSP · 2-approximation</small></span>
      </div>

      <MaintenanceRouteMap route={route} onManageTicket={onManageTicket} />

      <div className="maintenance-route__list-heading">
        <span className="eyebrow">Step by step</span>
        <h3>Detailed stop list</h3>
      </div>

      <ol className="maintenance-route__timeline" aria-label="Recommended maintenance stop order">
        {route.cycle.map((campusCode, index) => {
          const isStart = index === 0;
          const isReturn = index === route.cycle.length - 1;
          const stop = !isReturn ? stopByBuilding.get(campusCode) : null;
          const incomingLeg = index > 0 ? route.legs[index - 1] : null;

          return (
            <li key={`${campusCode}-${index}`} className={isStart || isReturn ? "is-depot" : ""}>
              {incomingLeg && (
                <div className="maintenance-route__leg" aria-label={`Walking distance ${roundedWeight(incomingLeg.distanceMeters)} meters`}>
                  <span />
                  <small>
                    {roundedWeight(incomingLeg.distanceMeters)} m
                    {Number(incomingLeg.stairsDistanceMeters) > 0
                      ? ` · ${roundedWeight(incomingLeg.stairsDistanceMeters)} m stairs`
                      : ""}
                  </small>
                </div>
              )}
              <article className="maintenance-route__stop">
                <div className="maintenance-route__marker">
                  {isStart
                    ? <Icon name="building" size={18} />
                    : isReturn
                      ? <Icon name="check" size={18} />
                      : index}
                </div>
                <div className="maintenance-route__stop-body">
                  <header>
                    <div>
                      <span className="eyebrow">{isStart ? "Start" : isReturn ? "Return" : `Stop ${index}`}</span>
                      <h3>
                        Building {campusCode}
                        {stop?.buildingName ? ` · ${stop.buildingName}` : ""}
                      </h3>
                    </div>
                    {stop && <span className="maintenance-route__task-count">{stop.tickets.length} {stop.tickets.length === 1 ? "task" : "tasks"}</span>}
                  </header>

                  {(isStart || isReturn) && !stop && (
                    <p className="maintenance-route__depot-note">
                      {isStart ? "Leave the maintenance base." : "Round complete — return to the maintenance base."}
                    </p>
                  )}

                  {stop && (
                    <div className="maintenance-route__tickets">
                      {stop.tickets.map((ticket) => (
                        <article key={ticket.public_id} className="maintenance-route__ticket">
                          <div>
                            <span className="maintenance-route__ticket-meta">
                              {ticket.ticket_number} · {titleCase(ticket.category)}
                            </span>
                            <strong>{ticket.title}</strong>
                            <small>{ticket.location_text}</small>
                          </div>
                          <div className="maintenance-route__ticket-actions">
                            <StatusChip status={ticket.priority} />
                            <StatusChip status={ticket.status} />
                            <button type="button" className="text-button" onClick={() => onManageTicket(ticket)}>
                              Manage
                            </button>
                          </div>
                        </article>
                      ))}
                    </div>
                  )}
                </div>
              </article>
            </li>
          );
        })}
      </ol>

      <p className="maintenance-route__note">
        Stair sections count at 1.5× their distance. Priority remains visible for operational decisions but does not distort the metric route.
      </p>
    </div>
  );
}
