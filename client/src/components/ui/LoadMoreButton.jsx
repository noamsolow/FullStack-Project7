export function LoadMoreButton({ hasMore, loading, error, onLoadMore }) {
  if (!hasMore && !error) return null;

  return (
    <div className="load-more" aria-live="polite">
      {error && <p role="alert">{error.message ?? "The next items could not be loaded."}</p>}
      <button
        type="button"
        className="button button--secondary"
        onClick={onLoadMore}
        disabled={loading}
      >
        {loading ? "Loading..." : error ? "Try again" : "Load more"}
      </button>
    </div>
  );
}
