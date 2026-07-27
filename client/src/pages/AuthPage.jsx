import { useCallback, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { LevGoLogo } from "../components/brand/LevGoLogo.jsx";
import { ErrorState } from "../components/ui/PageState.jsx";
import { useAuth } from "../features/auth/AuthContext.jsx";
import { authService } from "../services/authService.js";
import { catalogService } from "../services/catalogService.js";
import { useApiResource } from "../hooks/useApiResource.js";

const initialLogin = { email: "", password: "" };
const initialCustomer = {
  email: "",
  password: "",
  displayName: "",
  phone: "",
  customerType: "student",
};
const initialPartner = {
  ...initialCustomer,
  vendorName: "",
  vendorType: "campus_shop",
  buildingId: "",
  description: "",
};

export function AuthPage({ portal = "customer", mode = "login" }) {
  const isRegister = mode === "register";
  const isPartner = portal === "partner";
  const navigate = useNavigate();
  const location = useLocation();
  const { acceptSession } = useAuth();
  const [form, setForm] = useState(
    isRegister ? (isPartner ? initialPartner : initialCustomer) : initialLogin,
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const loadBuildings = useCallback(() => catalogService.buildings({ limit: 50 }), []);
  const buildings = useApiResource(loadBuildings);

  const copy = useMemo(() => {
    if (portal === "admin") return {
      eyebrow: "Campus administration",
      title: "Admin sign in",
      text: "Authorized administrators only.",
    };
    if (isPartner) return {
      eyebrow: "LevGo for partners",
      title: isRegister ? "Bring your service to campus" : "Welcome back, partner",
      text: isRegister
        ? "Create your vendor workspace and start managing campus requests."
        : "Manage products, orders, print jobs, and delivery zones.",
    };
    return {
      eyebrow: "Your campus account",
      title: isRegister ? "Join LevGo" : "Good to see you",
      text: isRegister
        ? "Register with your campus email and make the next study day easier."
        : "Sign in to order, print, and follow campus reports.",
    };
  }, [isPartner, isRegister, portal]);

  function update(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  async function submit(event) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      let result;
      if (isRegister && isPartner) result = await authService.registerPartner({
        ...form,
        buildingId: Number(form.buildingId),
      });
      else if (isRegister) result = await authService.registerCustomer(form);
      else if (portal === "partner") result = await authService.loginPartner(form);
      else if (portal === "admin") result = await authService.loginAdmin(form);
      else result = await authService.loginCustomer(form);
      acceptSession(result.data);
      const fallback = portal === "partner" ? "/partner" : portal === "admin" ? "/admin" : "/";
      navigate(location.state?.from?.pathname ?? fallback, { replace: true });
    } catch (caught) {
      setError(caught);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className={`auth-page auth-page--${portal}`}>
      <section className="auth-brand-panel">
        <Link to="/"><LevGoLogo /></Link>
        <div>
          <span className="eyebrow">{copy.eyebrow}</span>
          <h1>{copy.title}</h1>
          <p>{copy.text}</p>
        </div>
        <blockquote>
          “Everything the campus day needs, without another line to wait in.”
        </blockquote>
      </section>
      <main className="auth-form-panel">
        <form className="auth-form" onSubmit={submit}>
          <div className="auth-form__heading">
            <span>{isRegister ? "Create account" : "Secure access"}</span>
            <h2>{isRegister ? "Tell us the essentials" : "Sign in to LevGo"}</h2>
          </div>
          {error && (
            <div className="inline-error" role="alert">
              <strong>{error.message}</strong>
              {error.details?.map((detail) => <span key={detail.path}>{detail.path}: {detail.message}</span>)}
            </div>
          )}
          {isRegister && (
            <>
              <label>
                Full name
                <input name="displayName" value={form.displayName} onChange={update} autoComplete="name" required />
              </label>
              <label>
                Phone <span className="optional">Optional</span>
                <input name="phone" value={form.phone} onChange={update} autoComplete="tel" />
              </label>
            </>
          )}
          <label>
            Email
            <input name="email" type="email" value={form.email} onChange={update} autoComplete="email" required />
            {!isPartner && portal === "customer" && isRegister && <small>Use an approved campus email address.</small>}
          </label>
          <label>
            Password
            <input
              name="password"
              type="password"
              value={form.password}
              onChange={update}
              autoComplete={isRegister ? "new-password" : "current-password"}
              required
            />
            {isRegister && <small>10+ characters with uppercase, lowercase, number, and symbol.</small>}
          </label>
          {isRegister && !isPartner && (
            <fieldset className="segmented-field">
              <legend>I am a</legend>
              {["student", "teacher"].map((value) => (
                <label key={value} className={form.customerType === value ? "selected" : ""}>
                  <input
                    type="radio"
                    name="customerType"
                    value={value}
                    checked={form.customerType === value}
                    onChange={update}
                  />
                  {value[0].toUpperCase() + value.slice(1)}
                </label>
              ))}
            </fieldset>
          )}
          {isRegister && isPartner && (
            <>
              <div className="form-divider"><span>Vendor details</span></div>
              <label>
                Vendor name
                <input name="vendorName" value={form.vendorName} onChange={update} required />
              </label>
              <div className="field-row">
                <label>
                  Vendor type
                  <select name="vendorType" value={form.vendorType} onChange={update}>
                    <option value="food_court">Food court</option>
                    <option value="campus_shop">Campus shop</option>
                    <option value="vending_machine">Vending machine</option>
                    <option value="print_center">Print center</option>
                  </select>
                </label>
                <label>
                  Campus building
                  <select name="buildingId" value={form.buildingId} onChange={update} required>
                    <option value="">Choose building</option>
                    {buildings.data?.data?.map((building) => (
                      <option key={building.id} value={building.id}>{building.short_name}</option>
                    ))}
                  </select>
                </label>
              </div>
              <label>
                Description
                <textarea
                  name="description"
                  value={form.description}
                  onChange={update}
                  minLength={20}
                  maxLength={800}
                  required
                />
              </label>
              {buildings.error && <ErrorState error={buildings.error} onRetry={buildings.reload} />}
            </>
          )}
          <button className="button button--primary button--large button--full" disabled={submitting}>
            {submitting ? "Please wait..." : isRegister ? "Create account" : "Sign in"}
          </button>
          {portal !== "admin" && (
            <p className="auth-switch">
              {isRegister ? "Already have an account?" : "New to LevGo?"}{" "}
              <Link to={isRegister
                ? (isPartner ? "/partner/login" : "/login")
                : (isPartner ? "/partner/register" : "/register")}
              >
                {isRegister ? "Sign in" : "Create account"}
              </Link>
            </p>
          )}
          {portal === "customer" && !isRegister && (
            <Link className="partner-entry" to="/partner/login">Vendor or print partner? Open partner workspace →</Link>
          )}
        </form>
      </main>
    </div>
  );
}

