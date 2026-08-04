import { apiMediaUrl } from "../../services/core/apiClient.js";
import { ProductIllustration } from "./ProductIllustration.jsx";

export function ProductVisual({ product, large = false }) {
  if (product.image_public_id) {
    return (
      <div className={`product-visual ${large ? "product-visual--large" : ""}`}>
        <img
          src={apiMediaUrl(`/media/products/${product.image_public_id}`)}
          alt=""
          loading="lazy"
        />
      </div>
    );
  }
  return (
    <div className={`product-visual product-visual--illustrated ${large ? "product-visual--large" : ""}`}>
      <ProductIllustration product={product} />
    </div>
  );
}
