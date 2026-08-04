import { useCallback, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ConfirmDialog } from "../../../components/ui/ConfirmDialog.jsx";
import { Icon } from "../../../components/ui/Icon.jsx";
import { LoadMoreButton } from "../../../components/ui/LoadMoreButton.jsx";
import { EmptyState, ErrorState, LoadingState } from "../../../components/ui/PageState.jsx";
import { ProductVisual } from "../../../components/ui/ProductVisual.jsx";
import { Toast } from "../../../components/ui/Toast.jsx";
import { useCart } from "../../../features/cart/CartContext.jsx";
import { useApiResource } from "../../../hooks/useApiResource.js";
import { useDebouncedValue } from "../../../hooks/useDebouncedValue.js";
import { useLoadMoreResource } from "../../../hooks/useLoadMoreResource.js";
import { catalogService } from "../../../services/catalog/catalogService.js";
import { formatMoney, titleCase } from "../../../utils/format.js";

export function VendorPage() {
  const { slug } = useParams();
  const [query, setQuery] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [dietary, setDietary] = useState("");
  const [pending, setPending] = useState(null);
  const [toast, setToast] = useState("");
  const cart = useCart();
  const debouncedQuery = useDebouncedValue(query);
  const loadVendor = useCallback(() => catalogService.vendor(slug), [slug]);
  const loadProducts = useCallback(
    ({ page, limit }) => catalogService.products(slug, {
      query: debouncedQuery,
      maxPriceAgorot: maxPrice ? Math.round(Number(maxPrice) * 100) : undefined,
      dietary,
      page,
      limit,
    }),
    [debouncedQuery, dietary, maxPrice, slug],
  );
  const vendor = useApiResource(loadVendor, [loadVendor]);
  const products = useLoadMoreResource(loadProducts, { pageSize: 6 });

  if (vendor.loading) return <LoadingState label="Opening vendor..." />;
  if (vendor.error) return <ErrorState error={vendor.error} onRetry={vendor.reload} />;
  const current = vendor.data?.data;
  const vendorForCart = {
    publicId: current.public_id,
    name: current.name,
    slug: current.slug,
    type: current.vendor_type,
  };

  function add(product, replace = false) {
    const added = cart.addItem(product, vendorForCart, replace);
    if (!added) {
      setPending(product);
      return;
    }
    setPending(null);
    setToast(`${product.name} added to your cart`);
  }

  return (
    <div className="vendor-page">
      <section className="vendor-hero">
        <div className="page-container vendor-hero__content">
          <Link to={current.vendor_type === "campus_shop" ? "/shop" : "/eat"} className="back-link">
            ← Back to discovery
          </Link>
          <span className="eyebrow">{titleCase(current.vendor_type)}</span>
          <h1>{current.name}</h1>
          <p>{current.description}</p>
          <div className="vendor-hero__meta">
            <span><Icon name="building" /> {current.building_name}</span>
            <span><Icon name="clock" /> {current.estimated_min_minutes}–{current.estimated_max_minutes} min</span>
            <span>{current.delivery_enabled ? "Pickup & delivery" : "Pickup only"}</span>
          </div>
        </div>
      </section>
      <div className="page-container">
        <section className="product-filter-bar" aria-label="Product filters">
          <label className="search-field">
            <Icon name="search" />
            <span className="sr-only">Search products</span>
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search this vendor" maxLength={80} />
          </label>
          <label><span className="sr-only">Maximum price</span><select value={maxPrice} onChange={(event) => setMaxPrice(event.target.value)}><option value="">Any price</option><option value="10">Up to ₪10</option><option value="25">Up to ₪25</option><option value="50">Up to ₪50</option><option value="100">Up to ₪100</option></select></label>
          <label><span className="sr-only">Dietary filter</span><select value={dietary} onChange={(event) => setDietary(event.target.value)}><option value="">Any dietary tag</option>{["vegetarian", "vegan", "dairy", "meat", "dairy_free"].map((value) => <option key={value} value={value}>{titleCase(value)}</option>)}</select></label>
        </section>
        {products.loading && <LoadingState label="Loading products..." />}
        {products.error && products.items.length === 0 && <ErrorState error={products.error} onRetry={products.reload} />}
        {!products.loading && !products.error && products.items.length === 0 && (
          <EmptyState title="No matching products" message="Try a broader search or reset a filter." />
        )}
        <section className="product-grid" aria-live="polite">
          {products.items.map((product) => (
            <article className="product-card" key={product.public_id}>
              <ProductVisual product={product} />
              <div className="product-card__body">
                <div>
                  <span className="product-card__category">{product.category_name}</span>
                  <h2>{product.name}</h2>
                  <p>{product.description}</p>
                  {product.allergen_text && <small className="allergen">Allergens: {product.allergen_text}</small>}
                </div>
                <div className="product-card__footer">
                  <strong>{formatMoney(product.price_agorot)}</strong>
                  <button
                    className="add-button"
                    onClick={() => add(product)}
                    disabled={!current.is_open}
                    aria-label={`Add ${product.name} to cart`}
                  >
                    <Icon name="plus" />
                  </button>
                </div>
              </div>
            </article>
          ))}
        </section>
        <LoadMoreButton
          hasMore={products.meta.hasMore}
          loading={products.loadingMore}
          error={products.items.length ? products.error : null}
          onLoadMore={products.loadMore}
        />
      </div>
      <ConfirmDialog
        open={Boolean(pending)}
        title="Start a new cart?"
        message={`Your current cart is from ${cart.vendor?.name}. LevGo keeps one vendor per order.`}
        confirmLabel="Replace cart"
        destructive
        onCancel={() => setPending(null)}
        onConfirm={() => add(pending, true)}
      />
      <Toast message={toast} onClose={() => setToast("")} />
    </div>
  );
}
