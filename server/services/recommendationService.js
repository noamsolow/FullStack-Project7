import { listRecommendationCandidates } from "../repositories/catalogRepository.js";
import { recordRecommendation } from "../repositories/recommendationRepository.js";
import { requestRecommendations } from "../integrations/openaiClient.js";
import { publicId } from "../utils/identifiers.js";

function fallback(candidates, preferences) {
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
      reason: `${item.name} fits the selected need and costs ₪${(item.price_agorot / 100).toFixed(2)}.`,
    })),
  };
}

export async function recommend(user, input) {
  const candidates = await listRecommendationCandidates(input);
  const candidateIds = new Set(candidates.map((item) => item.public_id));
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
    providerUsed = "openai";
  } catch {
    result = fallback(candidates, input);
  }

  const candidateMap = new Map(candidates.map((item) => [item.public_id, item]));
  const safeRecommendations = (result.recommendations ?? [])
    .filter((item) => candidateIds.has(item.productId))
    .slice(0, 3)
    .map((item) => ({
      product: candidateMap.get(item.productId),
      reason: String(item.reason).slice(0, 300),
    }));

  await recordRecommendation({
    publicId: publicId(),
    userId: user.id,
    needType: input.needType,
    budgetAgorot: input.budgetAgorot,
    providerUsed,
    outcome: "success",
    resultCount: safeRecommendations.length,
  });

  return {
    source: providerUsed,
    summary: String(result.summary ?? "").slice(0, 500),
    recommendations: safeRecommendations,
    safetyNotice: "Verify ingredients and allergen information with the vendor before ordering.",
  };
}

