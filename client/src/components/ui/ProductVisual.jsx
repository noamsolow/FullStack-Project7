import { apiMediaUrl } from "../../services/core/apiClient.js";

const visuals = {
  meal: ["🥙", "visual--coral"],
  snack: ["🥨", "visual--gold"],
  drink: ["🥤", "visual--cyan"],
  study: ["✏️", "visual--violet"],
  technology: ["🔌", "visual--navy"],
  personal: ["🧴", "visual--rose"],
  dormitory: ["🛏️", "visual--mint"],
};

export function ProductVisual({ product, large = false }) {
  const [emoji, className] = visuals[product.need_type] ?? ["📦", "visual--violet"];
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
    <div className={`product-visual ${className} ${large ? "product-visual--large" : ""}`} aria-hidden="true">
      <span>{emoji}</span>
      <i />
    </div>
  );
}
