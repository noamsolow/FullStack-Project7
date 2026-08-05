import { useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Icon } from "../../components/ui/Icon.jsx";
import { ErrorState } from "../../components/ui/PageState.jsx";
import { useAuth } from "../../features/auth/AuthContext.jsx";
import { useApiResource } from "../../hooks/useApiResource.js";
import { authService } from "../../services/auth/authService.js";
import { formatMoney, titleCase } from "../../utils/format.js";
import { readSession, writeSession } from "../../utils/session.js";

export function AccountPage() {
  const { user, setUser, logout } = useAuth();
  const navigate = useNavigate();
  const [displayName, setDisplayName] = useState(user.displayName);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState(null);
  const loadSpending = useCallback(() => authService.spending(), []);
  const {
    data: spending,
    loading: spendingLoading,
    error: spendingError,
    reload: reloadSpending,
  } = useApiResource(loadSpending, [loadSpending]);

  async function save(event) {
    event.preventDefault();
    setNotice("");
    setError(null);
    try {
      const result = await authService.updateMe({ displayName });
      setUser(result.data);
      const current = readSession();
      if (current?.token) writeSession({ token: current.token, user: result.data });
      setNotice("Profile updated.");
    } catch (caught) {
      setError(caught);
    }
  }

  return (
    <div className="page-container account-page">
      <section className="account-hero">
        <span>{user.displayName.slice(0, 1).toUpperCase()}</span>
        <div><span className="eyebrow">Your account</span><h1>{user.displayName}</h1><p>{user.email}</p></div>
      </section>
      <div className="account-grid">
        <form className="card" onSubmit={save}>
          <h2>Profile</h2>
          <label>Display name<input value={displayName} onChange={(event) => setDisplayName(event.target.value)} minLength={2} maxLength={100} required /></label>
          <dl className="detail-list">
            <div><dt>Campus identity</dt><dd>{titleCase(user.customerType)}</dd></div>
            <div><dt>Application role</dt><dd>{titleCase(user.role)}</dd></div>
          </dl>
          {notice && <p className="success-notice">{notice}</p>}
          {error && <ErrorState error={error} />}
          <button className="button button--primary">Save changes</button>
        </form>
        <section className="card account-tokens">
          <div className="account-spending__icon"><Icon name="check" /></div>
          <span className="eyebrow">LevGo token balance</span>
          <h2>{Number(user.tokenBalance ?? 0).toLocaleString()} tokens</h2>
          <p>Use tokens for food and shop orders. One token equals ₪1 at checkout.</p>
        </section>
        <section className="card account-spending">
          <div className="account-spending__icon"><Icon name="cart" /></div>
          <span className="eyebrow">Completed payments</span>
          <h2>{spendingLoading ? "Calculating..." : formatMoney(spending?.data?.totalSpentAgorot ?? 0)}</h2>
          <p>Total value of completed orders and completed print jobs.</p>
          {spendingError && (
            <button className="button button--secondary" onClick={reloadSpending}>
              Try again
            </button>
          )}
          <button className="account-spending__logout" onClick={() => { logout(); navigate("/"); }}>
            <Icon name="logout" /> Sign out
          </button>
        </section>
      </div>
    </div>
  );
}
