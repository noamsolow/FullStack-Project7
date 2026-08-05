import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { CampusMap } from "../../../components/campus/CampusMap.jsx";
import { Icon } from "../../../components/ui/Icon.jsx";
import { PageHeader } from "../../../components/ui/PageHeader.jsx";
import { EmptyState, ErrorState } from "../../../components/ui/PageState.jsx";
import { ProductVisual } from "../../../components/ui/ProductVisual.jsx";
import { useAuth } from "../../../features/auth/AuthContext.jsx";
import { useCart } from "../../../features/cart/CartContext.jsx";
import { useApiResource } from "../../../hooks/useApiResource.js";
import { catalogService } from "../../../services/catalog/catalogService.js";
import { orderService } from "../../../services/commerce/orderService.js";
import { formatMoney } from "../../../utils/format.js";
import { readSession, writeSession } from "../../../utils/session.js";

export function CartPage() {
  const cart = useCart();
  const { user, setUser } = useAuth();
  const navigate = useNavigate();
  const [fulfillment, setFulfillment] = useState("pickup");
  const [paymentMethod, setPaymentMethod] = useState("tokens");
  const [buildingId, setBuildingId] = useState("");
  const [location, setLocation] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const loadVendor = useCallback(
    () => cart.vendor ? catalogService.vendor(cart.vendor.slug) : Promise.resolve({ data: null }),
    [cart.vendor],
  );
  const vendor = useApiResource(loadVendor, [loadVendor]);
  const loadCheckoutOptions = useCallback(() => orderService.checkoutOptions(), []);
  const paymentOptions = useApiResource(loadCheckoutOptions, [loadCheckoutOptions]);
  const details = vendor.data?.data;
  const selectedZone = details?.deliveryZones?.find(
    (zone) => String(zone.building_id) === String(buildingId),
  );
  const total = cart.subtotalAgorot + (fulfillment === "delivery" ? selectedZone?.fee_agorot ?? 0 : 0);
  const canDeliver = details?.delivery_enabled;
  const tokenBalance = Number(
    paymentOptions.data?.data?.tokenBalance ?? user?.tokenBalance ?? 0,
  );
  const tokensEnabled = Boolean(paymentOptions.data?.data?.tokensEnabled);
  const tokenCost = Math.ceil(total / 100);
  const canPayWithTokens = tokensEnabled && tokenBalance >= tokenCost;
  const paypalEnabled = Boolean(paymentOptions.data?.data?.paypalEnabled);

  useEffect(() => {
    if (!paymentOptions.data || canPayWithTokens || !paypalEnabled) return;
    setPaymentMethod("paypal");
  }, [canPayWithTokens, paymentOptions.data, paypalEnabled]);

  const groupedNotice = useMemo(() => {
    if (fulfillment !== "delivery" || !selectedZone) return null;
    return `Estimated ${selectedZone.eta_min_minutes}–${selectedZone.eta_max_minutes} minutes.`;
  }, [fulfillment, selectedZone]);

  async function checkout() {
    if (!user) {
      navigate("/login", { state: { from: { pathname: "/cart" } } });
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const result = await orderService.checkout({
        paymentMethod,
        items: cart.items.map((item) => ({
          productId: item.public_id,
          quantity: item.quantity,
        })),
        fulfillmentType: fulfillment,
        ...(fulfillment === "delivery"
          ? { deliveryBuildingId: Number(buildingId), deliveryLocation: location }
          : {}),
      });
      if (result.data.paymentRequired && result.data.approvalUrl) {
        sessionStorage.setItem("levgo.pending-payment", JSON.stringify({
          type: "order",
          publicId: result.data.orderPublicId,
        }));
        window.location.assign(result.data.approvalUrl);
        return;
      }
      if (result.data.paymentMethod === "tokens") {
        const updatedUser = {
          ...user,
          tokenBalance: result.data.remainingTokens,
        };
        setUser(updatedUser);
        const session = readSession();
        if (session?.token) writeSession({ ...session, user: updatedUser });
      }
      cart.clear();
      navigate(`/orders/${result.data.orderPublicId}`);
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
          action={<Link className="button button--primary" to="/services">Browse campus services</Link>}
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
              <CampusMap
                buildings={details?.deliveryZones?.filter((zone) => zone.is_active)}
                vendors={details ? [details] : []}
                selectedBuildingId={buildingId}
                onSelectBuilding={setBuildingId}
                title="Where should we deliver?"
              />
              {!buildingId && (
                <p className="delivery-notice">Select your building on the map to calculate delivery.</p>
              )}
              <label className="visually-hidden">
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
              {selectedZone && (
                <p className="delivery-notice">
                  Delivery to {selectedZone.building_name}: {formatMoney(selectedZone.fee_agorot)}.
                  {groupedNotice && ` ${groupedNotice}`}
                </p>
              )}
            </div>
          )}
          <h2 className="checkout-section-title">How would you like to pay?</h2>
          <div className="payment-options">
            <button
              type="button"
              className={paymentMethod === "tokens" ? "selected" : ""}
              onClick={() => setPaymentMethod("tokens")}
              disabled={!canPayWithTokens}
            >
              <Icon name="check" />
              <span>
                <strong>LevGo tokens</strong>
                <small>{tokensEnabled ? `${tokenBalance.toLocaleString()} available` : "Setup required"}</small>
              </span>
            </button>
            <button
              type="button"
              className={paymentMethod === "paypal" ? "selected" : ""}
              onClick={() => setPaymentMethod("paypal")}
              disabled={!paypalEnabled}
            >
              <span className="paypal-mark">P</span>
              <span>
                <strong>PayPal</strong>
                <small>{paypalEnabled ? "Secure PayPal checkout" : "Currently unavailable"}</small>
              </span>
            </button>
          </div>
          {!canPayWithTokens && (
            <p className="delivery-notice">
              This order needs {tokenCost.toLocaleString()} tokens. Choose PayPal or reduce the cart.
            </p>
          )}
          <dl className="price-summary">
            <div><dt>Items</dt><dd>{formatMoney(cart.subtotalAgorot)}</dd></div>
            <div><dt>Delivery</dt><dd>{fulfillment === "delivery" ? formatMoney(selectedZone?.fee_agorot ?? 0) : "Free"}</dd></div>
            <div className="price-summary__total"><dt>Total</dt><dd>{formatMoney(total)}</dd></div>
          </dl>
          {paymentOptions.error && <ErrorState error={paymentOptions.error} onRetry={paymentOptions.reload} />}
          {error && <ErrorState error={error} />}
          <button
            className="button button--primary button--large button--full"
            onClick={checkout}
            disabled={
              submitting
              || vendor.loading
              || paymentOptions.loading
              || Boolean(paymentOptions.error)
              || (paymentMethod === "tokens" && !canPayWithTokens)
              || (paymentMethod === "paypal" && !paypalEnabled)
              || (fulfillment === "delivery" && (
                !selectedZone
                || !location.trim()
              ))
            }
          >
            {submitting
              ? "Placing order..."
              : paymentMethod === "paypal"
                ? "Continue to PayPal"
                : `Pay ${tokenCost.toLocaleString()} tokens`}
          </button>
          <p className="secure-note"><Icon name="shield" size={16} /> Prices, delivery fees, token balances, and PayPal captures are verified by the server.</p>
        </aside>
      </div>
    </div>
  );
}
