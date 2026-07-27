import { useCallback, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Icon } from "../components/ui/Icon.jsx";
import { EmptyState, ErrorState } from "../components/ui/PageState.jsx";
import { PageHeader } from "../components/ui/PageHeader.jsx";
import { ProductVisual } from "../components/ui/ProductVisual.jsx";
import { useAuth } from "../features/auth/AuthContext.jsx";
import { useCart } from "../features/cart/CartContext.jsx";
import { useApiResource } from "../hooks/useApiResource.js";
import { catalogService } from "../services/catalogService.js";
import { orderService } from "../services/orderService.js";
import { formatMoney } from "../utils/format.js";

export function CartPage() {
  const cart = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [fulfillment, setFulfillment] = useState("pickup");
  const [buildingId, setBuildingId] = useState("");
  const [location, setLocation] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const loadVendor = useCallback(
    () => cart.vendor ? catalogService.vendor(cart.vendor.slug) : Promise.resolve({ data: null }),
    [cart.vendor],
  );
  const vendor = useApiResource(loadVendor, [loadVendor]);
  const details = vendor.data?.data;
  const selectedZone = details?.deliveryZones?.find(
    (zone) => String(zone.building_id) === String(buildingId),
  );
  const total = cart.subtotalAgorot + (fulfillment === "delivery" ? selectedZone?.fee_agorot ?? 0 : 0);
  const canDeliver = details?.delivery_enabled;

  const groupedNotice = useMemo(() => {
    if (fulfillment !== "delivery" || !selectedZone) return null;
    if (cart.subtotalAgorot < selectedZone.minimum_order_agorot) {
      return `Add ${formatMoney(selectedZone.minimum_order_agorot - cart.subtotalAgorot)} more for this delivery zone.`;
    }
    return `Estimated ${selectedZone.eta_min_minutes}–${selectedZone.eta_max_minutes} minutes.`;
  }, [cart.subtotalAgorot, fulfillment, selectedZone]);

  async function checkout() {
    if (!user) {
      navigate("/login", { state: { from: { pathname: "/cart" } } });
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const result = await orderService.checkout({
        items: cart.items.map((item) => ({
          productId: item.public_id,
          quantity: item.quantity,
        })),
        fulfillmentType: fulfillment,
        ...(fulfillment === "delivery"
          ? { deliveryBuildingId: Number(buildingId), deliveryLocation: location }
          : {}),
      });
      sessionStorage.setItem("levgo.pending-payment", JSON.stringify({
        type: "order",
        publicId: result.data.orderPublicId,
      }));
      window.location.assign(result.data.approvalUrl);
    } catch (caught) {
      setError(caught);
    } finally {
      setSubmitting(false);
    }
  }

  if (!cart.items.length) {
    return (
      <div className="page-container">
        <PageHeader eyebrow="Your cart" title="Ready when you are" />
        <EmptyState
          icon="cart"
          title="Your cart is empty"
          message="Choose something from Eat or Shop and it will wait here."
          action={<Link className="button button--primary" to="/eat">Browse campus options</Link>}
        />
      </div>
    );
  }

  return (
    <div className="page-container cart-page">
      <PageHeader
        eyebrow="Your cart"
        title={`From ${cart.vendor.name}`}
        description="One vendor per order keeps preparation and delivery clear."
      />
      <div className="cart-layout">
        <section className="cart-items" aria-label="Cart items">
          {cart.items.map((item) => (
            <article className="cart-item" key={item.public_id}>
              <ProductVisual product={item} />
              <div className="cart-item__info">
                <h2>{item.name}</h2>
                <p>{formatMoney(item.price_agorot)} each</p>
              </div>
              <div className="quantity-control" aria-label={`Quantity for ${item.name}`}>
                <button onClick={() => cart.setQuantity(item.public_id, item.quantity - 1)}><Icon name="minus" /></button>
                <span>{item.quantity}</span>
                <button onClick={() => cart.setQuantity(item.public_id, item.quantity + 1)}><Icon name="plus" /></button>
              </div>
              <strong>{formatMoney(item.price_agorot * item.quantity)}</strong>
            </article>
          ))}
          <button className="text-button text-button--danger" onClick={cart.clear}>Clear cart</button>
        </section>

        <aside className="checkout-card">
          <h2>How should we get it to you?</h2>
          <div className="fulfillment-options">
            <button className={fulfillment === "pickup" ? "selected" : ""} onClick={() => setFulfillment("pickup")}>
              <Icon name="shop" /> <span><strong>Pickup</strong><small>Collect from {details?.building_name ?? "vendor"}</small></span>
            </button>
            <button
              className={fulfillment === "delivery" ? "selected" : ""}
              onClick={() => setFulfillment("delivery")}
              disabled={!canDeliver}
            >
              <Icon name="building" /> <span><strong>Campus delivery</strong><small>{canDeliver ? "Choose your building" : "Not available"}</small></span>
            </button>
          </div>
          {fulfillment === "delivery" && (
            <div className="checkout-fields">
              <label>
                Delivery building
                <select value={buildingId} onChange={(event) => setBuildingId(event.target.value)} required>
                  <option value="">Choose a delivery zone</option>
                  {details?.deliveryZones?.filter((zone) => zone.is_active).map((zone) => (
                    <option key={zone.building_id} value={zone.building_id}>
                      {zone.building_name} · {formatMoney(zone.fee_agorot)}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Room or meeting point
                <input
                  value={location}
                  onChange={(event) => setLocation(event.target.value)}
                  placeholder="Room 214, main lobby..."
                  maxLength={180}
                  required
                />
              </label>
              {groupedNotice && <p className="delivery-notice">{groupedNotice}</p>}
            </div>
          )}
          <dl className="price-summary">
            <div><dt>Items</dt><dd>{formatMoney(cart.subtotalAgorot)}</dd></div>
            <div><dt>Delivery</dt><dd>{fulfillment === "delivery" ? formatMoney(selectedZone?.fee_agorot ?? 0) : "Free"}</dd></div>
            <div className="price-summary__total"><dt>Total</dt><dd>{formatMoney(total)}</dd></div>
          </dl>
          {error && <ErrorState error={error} />}
          <button
            className="button button--primary button--large button--full"
            onClick={checkout}
            disabled={
              submitting
              || vendor.loading
              || (fulfillment === "delivery" && (
                !selectedZone
                || !location.trim()
                || cart.subtotalAgorot < selectedZone.minimum_order_agorot
              ))
            }
          >
            {submitting ? "Creating secure checkout..." : user ? "Continue to PayPal" : "Sign in to checkout"}
          </button>
          <p className="secure-note"><Icon name="shield" size={16} /> Prices and totals are verified by LevGo’s server.</p>
        </aside>
      </div>
    </div>
  );
}

