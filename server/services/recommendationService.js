import { requestRecommendations } from "../integrations/geminiClient.js";
import { listRecommendationCandidates } from "../models/catalogModel.js";

function recommendationFallback(candidates, preferences) {
  const ranked = [...candidates]
    .sort((a, b) => {
      const aRemaining = preferences.budgetAgorot - a.price_agorot;
      const bRemaining = preferences.budgetAgorot - b.price_agorot;
      return aRemaining - bRemaining || a.name.localeCompare(b.name);
    })
    .slice(0, 3);
  return {
    summary: ranked.length
      ? "These available campus picks fit the preferences and budget."
      : "No available products currently match all selected preferences.",
    recommendations: ranked.map((item) => ({
      productId: item.public_id,
      reason: `${item.name} fits the selected need and costs NIS ${(item.price_agorot / 100).toFixed(2)}.`,
    })),
  };
}

export function safeProductRecommendations(result, candidates) {
  const candidateIds = new Set(candidates.map((item) => item.public_id));
  const candidateMap = new Map(candidates.map((item) => [item.public_id, item]));
  const recommendations = Array.isArray(result.recommendations)
    ? result.recommendations
    : [];
  return recommendations
    .filter((item) => candidateIds.has(item.productId))
    .slice(0, 3)
    .map((item) => ({
      product: candidateMap.get(item.productId),
      reason: String(item.reason ?? "").slice(0, 300),
    }));
}

export async function recommend(_user, input) {
  const candidates = await listRecommendationCandidates(input);
  let result;
  let providerUsed = "fallback";
  try {
    result = await requestRecommendations(
      {
        budgetAgorot: input.budgetAgorot,
        needType: input.needType,
        category: input.category ?? null,
        dietary: input.dietary,
      },
      candidates.map((item) => ({
        productId: item.public_id,
        name: item.name,
        description: item.description,
        priceAgorot: item.price_agorot,
        dietary: item.dietary_tags,
        allergenNotice: item.allergen_text,
        category: item.category_name,
        vendor: item.vendor_name,
      })),
    );
    providerUsed = "gemini";
  } catch {
    result = recommendationFallback(candidates, input);
  }

  return {
    source: providerUsed,
    summary: String(result.summary ?? "").slice(0, 500),
    recommendations: safeProductRecommendations(result, candidates),
    safetyNotice: "Verify ingredients and allergen information with the vendor before ordering.",
  };
}
