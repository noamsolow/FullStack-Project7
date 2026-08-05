import { useCallback, useState } from "react";
import { CampusRouteMap } from "../../components/campus/CampusRouteMap.jsx";
import { Icon } from "../../components/ui/Icon.jsx";
import { EmptyState, ErrorState, LoadingState } from "../../components/ui/PageState.jsx";
import { StatusChip } from "../../components/ui/StatusChip.jsx";
import { useApiResource } from "../../hooks/useApiResource.js";
import { partnerService } from "../../services/portals/partnerService.js";
import { formatDate } from "../../utils/format.js";

function roundedDistance(value) {
  return new Intl.NumberFormat("en-IL", { maximumFractionDigits: 1 }).format(value);
}

export function VendorDeliveryRoutePlan({ onManageOrder }) {
  const [requested, setRequested] = useState(false);

  if (!requested) {
    return (
      <section className="maintenance-route-launch card" aria-labelledby="vendor-route-launch-title">
        <span className="maintenance-route-launch__icon"><Icon name="route" size={30} /></span>
        <div>
          <span className="eyebrow">Smart delivery routing</span>
          <h2 id="vendor-route-launch-title">Plan a route for active deliveries</h2>
          <p>Generate a suggested campus round for this vendor&apos;s delivery orders that are being prepared or are on the way.</p>
        </div>
        <button type="button" className="button button--primary" onClick={() => setRequested(true)}>
          <Icon name="route" size={18} /> Calculate delivery route
        </button>
      </section>
    );
  }

  return (
    <RequestedVendorRoute
      onClose={() => setRequested(false)}
      onManageOrder={onManageOrder}
    />
  );
}

function RequestedVendorRoute({ onClose, onManageOrder }) {
  const load = useCallback(() => partnerService.deliveryRoute(), []);
  const { data, loading, error, reload } = useApiResource(load);
  const route = data?.data;

  return (
    <section className="maintenance-route card" aria-labelledby="vendor-route-title">
      <div className="maintenance-route__heading">
        <div>
          <span className="eyebrow">Route optimization</span>
          <h2 id="vendor-route-title">Recommended delivery round</h2>
          <p>The route starts and ends at your vendor building and only includes your active delivery orders.</p>
        </div>
        <div className="maintenance-route__actions">
          <button type="button" className="button button--secondary button--small" onClick={reload} disabled={loading}>
            Refresh route
          </button>
          <button type="button" className="button button--ghost button--small" onClick={onClose}>
            Close route
          </button>
        </div>
      </div>

      {loading && <LoadingState label="Calculating the suggested delivery route..." />}
      {error && <ErrorState error={error} onRetry={reload} />}
      {route && route.orderCount === 0 && (
        <EmptyState
          icon="check"
          title="No active delivery route needed"
          message="Move a delivery order into progress to include it in the route suggestion."
        />
      )}
      {route && route.orderCount > 0 && (
        <VendorRouteResult route={route} onManageOrder={onManageOrder} />
      )}
    </section>
  );
}

function VendorRouteResult({ route, onManageOrder }) {
  return (
    <div className="maintenance-route__result" aria-live="polite">
      <div className="maintenance-route__summary">
        <span><strong>{route.orderCount}</strong><small>Active deliveries</small></span>
        <span><strong>{route.stopCount}</strong><small>Campus stops</small></span>
        <span><strong>{roundedDistance(route.totalDistanceMeters)}</strong><small>Walking meters</small></span>
        <span><strong>{roundedDistance(route.totalWeight)}</strong><small>Weighted meters</small></span>
        <span className="maintenance-route__algorithm"><Icon name="route" size={18} /><small>Metric TSP · 2-approximation</small></span>
      </div>

      {route.hasMoreOrders && (
        <p className="maintenance-route__limit-note" role="status">
          This suggestion uses the first {route.limit} active deliveries. Complete or advance those orders, then refresh for the next group.
        </p>
      )}

      <CampusRouteMap
        route={route}
        itemsKey="orders"
        itemNoun="delivery"
        title="Follow the numbered delivery stops"
        imageAlt="Aerial campus map with the suggested vendor delivery route"
        depotLabel="Vendor"
        renderItem={(order) => (
          <article key={order.public_id}>
            <div>
              <small>{order.order_number} · {order.customer_name}</small>
              <strong>{order.building_name}</strong>
              <span>{order.delivery_location || "Building entrance"}</span>
            </div>
            <div>
              <StatusChip status={order.status} />
              <button type="button" className="text-button" onClick={() => onManageOrder(order)}>Manage</button>
            </div>
          </article>
        )}
      />

      <div className="maintenance-route__list-heading">
        <span className="eyebrow">Suggested sequence</span>
        <h3>Delivery stop list</h3>
      </div>
      <ol className="vendor-route-stop-list" aria-label="Suggested delivery stop order">
        {route.stops.map((stop, index) => (
          <li key={stop.campusCode}>
            <span>{index + 1}</span>
            <div>
              <strong>Building {stop.campusCode} · {stop.buildingName}</strong>
              <small>{stop.orders.length} {stop.orders.length === 1 ? "delivery" : "deliveries"}</small>
            </div>
            <div className="vendor-route-stop-list__orders">
              {stop.orders.map((order) => (
                <button type="button" key={order.public_id} onClick={() => onManageOrder(order)}>
                  <span><strong>{order.order_number}</strong><small>{order.customer_name} · {formatDate(order.created_at)}</small></span>
                  <StatusChip status={order.status} />
                </button>
              ))}
            </div>
          </li>
        ))}
      </ol>
      <p className="maintenance-route__note">
        Starts and returns at building {route.depotBuilding} ({route.depotBuildingName}). Stair sections count at 1.5× their distance.
      </p>
    </div>
  );
}
