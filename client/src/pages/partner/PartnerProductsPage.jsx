import { useCallback, useRef, useState } from "react";
import { ConfirmDialog } from "../../components/ui/ConfirmDialog.jsx";
import { LoadMoreButton } from "../../components/ui/LoadMoreButton.jsx";
import { PageHeader } from "../../components/ui/PageHeader.jsx";
import { EmptyState, ErrorState, LoadingState } from "../../components/ui/PageState.jsx";
import { StatusChip } from "../../components/ui/StatusChip.jsx";
import { useApiResource } from "../../hooks/useApiResource.js";
import { useLoadMoreResource } from "../../hooks/useLoadMoreResource.js";
import { catalogService } from "../../services/catalog/catalogService.js";
import { partnerService } from "../../services/portals/partnerService.js";
import { formatMoney, titleCase } from "../../utils/format.js";

const blank = {
  categorySlug: "stationery",
  sku: "",
  name: "",
  description: "",
  needType: "study",
  price: "",
  stockQuantity: "",
  dietaryTags: [],
  allergenText: "",
  isAvailable: true,
};

function toForm(product) {
  if (!product) return { ...blank };
  return {
    categorySlug: product.category_slug,
    sku: product.sku,
    name: product.name,
    description: product.description,
    needType: product.need_type,
    price: (product.price_agorot / 100).toFixed(2),
    stockQuantity: product.stock_quantity ?? "",
    dietaryTags: product.dietary_tags ?? [],
    allergenText: product.allergen_text ?? "",
    isAvailable: Boolean(product.is_available),
  };
}

export function PartnerProductsPage() {
  const [editor, setEditor] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [actionError, setActionError] = useState(null);
  const loadProducts = useCallback(
    ({ page, limit }) => partnerService.products({ page, limit }),
    [],
  );
  const loadCategories = useCallback(() => catalogService.categories(), []);
  const products = useLoadMoreResource(loadProducts, { pageSize: 10 });
  const categories = useApiResource(loadCategories);

  async function remove() {
    try {
      await partnerService.deleteProduct(confirmDelete.public_id);
      setConfirmDelete(null);
      products.reload();
    } catch (caught) {
      setActionError(caught);
    }
  }

  return (
    <div className="portal-page">
      <PageHeader
        eyebrow="Catalog"
        title="Products"
        description="Your public menu and supply inventory."
        actions={<button className="button button--primary" onClick={() => setEditor({ product: null, form: toForm(null) })}>Add product</button>}
      />
      {(products.loading || categories.loading) && <LoadingState />}
      {products.error && !products.items.length && <ErrorState error={products.error} onRetry={products.reload} />}
      {categories.error && <ErrorState error={categories.error} onRetry={categories.reload} />}
      {actionError && <ErrorState error={actionError} />}
      {!products.loading && !products.error && products.items.length === 0 && <EmptyState title="No products yet" message="Add your first item to open the storefront." />}
      <div className="data-table-wrap">
        <table className="data-table">
          <thead><tr><th>Product</th><th>Category</th><th>Price</th><th>Stock</th><th>Status</th><th><span className="sr-only">Actions</span></th></tr></thead>
          <tbody>
            {products.items.map((product) => (
              <tr key={product.public_id}>
                <td><strong>{product.name}</strong><small>{product.sku}</small></td>
                <td>{product.category_name}</td>
                <td>{formatMoney(product.price_agorot)}</td>
                <td>{product.stock_quantity ?? "Made to order"}</td>
                <td><StatusChip status={product.is_available ? "active" : "blocked"} /></td>
                <td className="row-actions"><button onClick={() => setEditor({ product, form: toForm(product) })}>Edit</button><button onClick={() => setConfirmDelete(product)}>Remove</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <LoadMoreButton
        hasMore={products.meta.hasMore}
        loading={products.loadingMore}
        error={products.items.length ? products.error : null}
        onLoadMore={products.loadMore}
      />
      {editor && (
        <ProductEditor
          state={editor}
          categories={categories.data?.data ?? []}
          onClose={() => setEditor(null)}
          onSaved={() => { setEditor(null); products.reload(); }}
        />
      )}
      <ConfirmDialog
        open={Boolean(confirmDelete)}
        title="Remove this product?"
        message={`${confirmDelete?.name ?? "This product"} will no longer appear in the catalog. Existing order history is preserved.`}
        confirmLabel="Remove product"
        destructive
      onCancel={() => setConfirmDelete(null)}
      onConfirm={remove}
      />
    </div>
  );
}

function ProductEditor({ state, categories, onClose, onSaved }) {
  const [form, setForm] = useState(state.form);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const imageRef = useRef(null);
  const [image, setImage] = useState(null);
  const [altText, setAltText] = useState("");

  function update(event) {
    const { name, value, checked, type } = event.target;
    setForm((current) => ({ ...current, [name]: type === "checkbox" ? checked : value }));
  }

  async function submit(event) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    const payload = {
      categorySlug: form.categorySlug,
      sku: form.sku,
      name: form.name,
      description: form.description,
      needType: form.needType,
      priceAgorot: Math.round(Number(form.price) * 100),
      stockQuantity: form.stockQuantity === "" ? null : Number(form.stockQuantity),
      dietaryTags: form.dietaryTags,
      allergenText: form.allergenText || null,
      isAvailable: form.isAvailable,
    };
    try {
      const result = state.product
        ? await partnerService.updateProduct(state.product.public_id, payload)
        : await partnerService.createProduct(payload);
      const productId = state.product?.public_id ?? result.data.public_id;
      if (image) {
        const imageBody = new FormData();
        imageBody.append("image", image);
        imageBody.append("altText", altText);
        await partnerService.uploadProductImage(productId, imageBody);
      }
      onSaved();
    } catch (caught) {
      setError(caught);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="drawer-backdrop" role="presentation">
      <section className="editor-drawer" role="dialog" aria-modal="true" aria-labelledby="product-editor-title">
        <div className="editor-drawer__head"><div><span className="eyebrow">Catalog editor</span><h2 id="product-editor-title">{state.product ? "Edit product" : "New product"}</h2></div><button className="icon-button" onClick={onClose} aria-label="Close">×</button></div>
        <form onSubmit={submit}>
          <div className="field-row"><label>Name<input name="name" value={form.name} onChange={update} minLength={2} required /></label><label>SKU<input name="sku" value={form.sku} onChange={update} minLength={2} required /></label></div>
          <label>Description<textarea name="description" value={form.description} onChange={update} minLength={10} maxLength={1000} required /></label>
          <div className="field-row">
            <label>Category<select name="categorySlug" value={form.categorySlug} onChange={update}>{categories.map((category) => <option key={category.slug} value={category.slug}>{category.name}</option>)}</select></label>
            <label>Need type<select name="needType" value={form.needType} onChange={update}>{["meal", "snack", "drink", "study", "technology", "personal", "dormitory"].map((value) => <option key={value} value={value}>{titleCase(value)}</option>)}</select></label>
          </div>
          <div className="field-row"><label>Price (ILS)<input name="price" type="number" min="1" max="1000" step="0.01" value={form.price} onChange={update} required /></label><label>Stock <span className="optional">Blank = made to order</span><input name="stockQuantity" type="number" min="0" value={form.stockQuantity} onChange={update} /></label></div>
          <label>Allergen notice <span className="optional">Optional</span><input name="allergenText" value={form.allergenText} onChange={update} maxLength={500} /></label>
          <label className="check-field"><input name="isAvailable" type="checkbox" checked={form.isAvailable} onChange={update} /> Available to customers</label>
          <div className="image-upload-field">
            <label>Product image <span className="optional">Optional · JPEG, PNG, or WebP</span></label>
            <button type="button" className="button button--secondary" onClick={() => imageRef.current?.click()}>{image ? image.name : "Choose image"}</button>
            <input className="sr-only" ref={imageRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => setImage(event.target.files?.[0] ?? null)} />
            {image && <label>Image description<input value={altText} onChange={(event) => setAltText(event.target.value)} minLength={2} required /></label>}
          </div>
          {error && <ErrorState error={error} />}
          <div className="form-actions"><button type="button" className="button button--secondary" onClick={onClose}>Cancel</button><button className="button button--primary" disabled={saving}>{saving ? "Saving..." : "Save product"}</button></div>
        </form>
      </section>
    </div>
  );
}
