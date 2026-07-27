import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Icon } from "../../../components/ui/Icon.jsx";
import { ErrorState, LoadingState } from "../../../components/ui/PageState.jsx";
import { useCart } from "../../../features/cart/CartContext.jsx";
import { orderService } from "../../../services/commerce/orderService.js";
import { printService } from "../../../services/printing/printService.js";

function pendingPayment() {
  try {
    return JSON.parse(sessionStorage.getItem("levgo.pending-payment"));
  } catch {
    return null;
  }
}

export function PaymentReturnPage({ cancelled = false }) {
  const [search] = useSearchParams();
  const { clear } = useCart();
  const [state, setState] = useState({ loading: !cancelled, error: null, payment: pendingPayment() });
  const providerOrderId = search.get("token");

  useEffect(() => {
    if (cancelled) return;
    const payment = pendingPayment();
    if (!payment || !providerOrderId) {
      setState({ loading: false, error: new Error("Payment details are missing. Open the related order to check its status."), payment });
      return;
    }
    let active = true;
    const service = payment.type === "print" ? printService : orderService;
    service.capture(payment.publicId, providerOrderId)
      .then(() => {
        if (!active) return;
        if (payment.type === "order") clear();
        sessionStorage.removeItem("levgo.pending-payment");
        setState({ loading: false, error: null, payment });
      })
      .catch((error) => {
        if (active) setState({ loading: false, error, payment });
      });
    return () => {
      active = false;
    };
  }, [cancelled, clear, providerOrderId]);

  if (cancelled) {
    return (
      <div className="page-container centered-result">
        <span className="result-icon result-icon--warning"><Icon name="close" size={34} /></span>
        <h1>Payment was not completed</h1>
        <p>No card details reached LevGo. You can return to your order and try again.</p>
        <Link className="button button--primary" to="/orders">View orders</Link>
      </div>
    );
  }
  if (state.loading) return <LoadingState label="Confirming your secure payment..." />;
  if (state.error) return (
    <div className="page-container centered-result">
      <ErrorState error={state.error} />
      <Link className="button button--secondary" to={state.payment?.type === "print" ? "/print/jobs" : "/orders"}>Check status</Link>
    </div>
  );
  const destination = state.payment?.type === "print"
    ? `/print/${state.payment.publicId}`
    : `/orders/${state.payment.publicId}`;
  return (
    <div className="page-container centered-result">
      <span className="result-icon"><Icon name="check" size={34} /></span>
      <span className="eyebrow">Payment confirmed</span>
      <h1>You are all set.</h1>
      <p>LevGo verified the PayPal capture. Follow progress from the detail page.</p>
      <Link className="button button--primary" to={destination}>View progress</Link>
    </div>
  );
}
