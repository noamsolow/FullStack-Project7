import { Link } from "react-router-dom";
import { LevGoMark } from "../../components/brand/LevGoLogo.jsx";

export function NotFoundPage() {
  return (
    <div className="page-container centered-result">
      <LevGoMark size={84} />
      <span className="eyebrow">404 · Off the campus route</span>
      <h1>We could not find that page.</h1>
      <p>The link may be old, or the page may belong to another account.</p>
      <Link className="button button--primary" to="/">Back to LevGo</Link>
    </div>
  );
}
