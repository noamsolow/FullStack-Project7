import { useState } from "react";
import { Link } from "react-router-dom";
import { Icon } from "../components/ui/Icon.jsx";
import { PageHeader } from "../components/ui/PageHeader.jsx";
import { ErrorState } from "../components/ui/PageState.jsx";
import { ProductVisual } from "../components/ui/ProductVisual.jsx";
import { recommendationService } from "../services/recommendationService.js";
import { formatMoney, titleCase } from "../utils/format.js";

const needs = ["meal", "snack", "drink", "study", "technology", "personal", "dormitory"];

export function RecommendationPage() {
  const [form, setForm] = useState({
    budget: "40",
    needType: "meal",
    dietary: "",
  });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function submit(event) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const response = await recommendationService.recommend({
        budgetAgorot: Math.round(Number(form.budget) * 100),
        needType: form.needType,
        category: null,
        dietary: form.dietary ? [form.dietary] : [],
      });
      setResult(response.data);
    } catch (caught) {
      setError(caught);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="page-container recommend-page">
      <PageHeader
        eyebrow="LevGo assistant"
        title="What should I get?"
        description="Tell us the basics. The assistant only considers products currently available in LevGo."
      />
      <div className="recommend-layout">
        <form className="recommend-form" onSubmit={submit}>
          <span className="assistant-orb"><Icon name="sparkles" size={30} /></span>
          <h2>Shape your recommendation</h2>
          <label>
            I need
            <select value={form.needType} onChange={(event) => setForm({ ...form, needType: event.target.value })}>
              {needs.map((need) => <option key={need} value={need}>{titleCase(need)}</option>)}
            </select>
          </label>
          <label>
            Maximum budget
            <div className="money-input"><span>₪</span><input type="number" min="5" max="2000" value={form.budget} onChange={(event) => setForm({ ...form, budget: event.target.value })} /></div>
          </label>
          {["meal", "snack", "drink"].includes(form.needType) && (
            <label>
              Dietary preference
              <select value={form.dietary} onChange={(event) => setForm({ ...form, dietary: event.target.value })}>
                <option value="">No preference</option>
                <option value="vegetarian">Vegetarian</option>
                <option value="vegan">Vegan</option>
                <option value="dairy_free">Dairy-free</option>
              </select>
            </label>
          )}
          <button className="button button--primary button--large button--full" disabled={loading}>
            <Icon name="sparkles" /> {loading ? "Finding matches..." : "Recommend something"}
          </button>
          <p className="ai-safety">The assistant cannot place orders or make allergen guarantees.</p>
        </form>
        <section className="recommend-results" aria-live="polite">
          {!result && !error && (
            <div className="recommend-placeholder">
              <Icon name="sparkles" size={38} />
              <h2>Your campus shortlist will appear here</h2>
              <p>Budget and availability are checked before the AI sees any catalog data.</p>
            </div>
          )}
          {error && <ErrorState error={error} />}
          {result && (
            <>
              <div className="result-heading">
                <span className={`source-badge source-badge--${result.source}`}>{result.source === "openai" ? "AI generated" : "Smart fallback"}</span>
                <h2>{result.summary}</h2>
                <p>{result.safetyNotice}</p>
              </div>
              <div className="recommend-list">
                {result.recommendations.map(({ product, reason }, index) => (
                  <article key={product.public_id}>
                    <span className="recommend-rank">0{index + 1}</span>
                    <ProductVisual product={product} />
                    <div>
                      <small>{product.vendor_name}</small>
                      <h3>{product.name}</h3>
                      <p>{reason}</p>
                      <strong>{formatMoney(product.price_agorot)}</strong>
                    </div>
                    <Link to={`/vendors/${product.vendor_slug}`} className="icon-button" aria-label={`Open ${product.vendor_name}`}>
                      <Icon name="arrow" />
                    </Link>
                  </article>
                ))}
              </div>
            </>
          )}
        </section>
      </div>
    </div>
  );
}

