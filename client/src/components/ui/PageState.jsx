import { Icon } from "./Icon.jsx";

export function LoadingState({ label = "Loading..." }) {
  return (
    <div className="page-state" aria-live="polite">
      <span className="spinner" />
      <p>{label}</p>
    </div>
  );
}

export function ErrorState({ error, onRetry }) {
  return (
    <div className="page-state page-state--error" role="alert">
      <span className="state-icon"><Icon name="report" size={28} /></span>
      <h2>We hit a snag</h2>
      <p>{error?.message ?? "The request could not be completed."}</p>
      {error?.requestId && <small>Request ID: {error.requestId}</small>}
      {onRetry && <button className="button button--secondary" onClick={onRetry}>Try again</button>}
    </div>
  );
}

export function EmptyState({ icon = "search", title, message, action }) {
  return (
    <div className="page-state">
      <span className="state-icon"><Icon name={icon} size={28} /></span>
      <h2>{title}</h2>
      <p>{message}</p>
      {action}
    </div>
  );
}

