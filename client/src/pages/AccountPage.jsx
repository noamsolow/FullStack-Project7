import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Icon } from "../components/ui/Icon.jsx";
import { ErrorState } from "../components/ui/PageState.jsx";
import { useAuth } from "../features/auth/AuthContext.jsx";
import { authService } from "../services/authService.js";
import { titleCase } from "../utils/format.js";
import { readSession, writeSession } from "../utils/session.js";

export function AccountPage() {
  const { user, setUser, logout } = useAuth();
  const navigate = useNavigate();
  const [displayName, setDisplayName] = useState(user.displayName);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState(null);

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
        <section className="card account-links">
          <h2>Your LevGo</h2>
          <Link to="/orders"><Icon name="orders" /><span><strong>Orders</strong><small>Food and campus supplies</small></span><Icon name="arrow" /></Link>
          <Link to="/print/jobs"><Icon name="print" /><span><strong>Print jobs</strong><small>Quotes and pickup codes</small></span><Icon name="arrow" /></Link>
          <Link to="/report"><Icon name="report" /><span><strong>Maintenance reports</strong><small>Campus support updates</small></span><Icon name="arrow" /></Link>
          <button onClick={() => { logout(); navigate("/"); }}><Icon name="logout" /> Sign out</button>
        </section>
      </div>
    </div>
  );
}
