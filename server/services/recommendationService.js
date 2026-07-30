import {
  listRecommendationCandidates,
  listShoppingAssistantCandidates,
} from "../models/catalogModel.js";
import {
  listCustomerShoppingHistory,
  recordRecommendation,
} from "../models/recommendationModel.js";
import {
  requestRecommendations,
  requestShoppingChat,
} from "../integrations/geminiClient.js";
import { publicId } from "../utils/identifiers.js";

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

const ignoredWords = new Set([
  "about", "also", "and", "are", "based", "below", "budget", "but", "can",
  "could", "for", "from", "give", "have", "help", "here", "i", "in",
  "is", "it", "item", "items", "less", "max", "maximum", "me", "my",
  "need", "nis", "of", "on", "one", "or", "please", "recommend",
  "something", "than", "that", "the", "this", "three", "to", "two",
  "under", "up", "want", "what", "with", "you",
]);

const needPatterns = [
  { needType: "meal", pattern: /\b(meal|breakfast|lunch|dinner|hungry|food)\b/i },
  { needType: "snack", pattern: /\b(snack|quick bite|sweet|salty)\b/i },
  { needType: "drink", pattern: /\b(drink|thirsty|coffee|tea|water|juice)\b/i },
  { needType: "study", pattern: /\b(study|class|notebook|pen|exam|school)\b/i },
  { needType: "technology", pattern: /\b(technology|tech|charger|cable|electronic)\b/i },
  { needType: "personal", pattern: /\b(personal|hygiene|toiletries|care)\b/i },
  { needType: "dormitory", pattern: /\b(dorm|dormitory|room|bed|laundry)\b/i },
];

function chatText(messages) {
  return messages
    .filter((message) => message.role === "user")
    .slice(-3)
    .map((message) => message.content)
    .join(" ");
}

function requestedBudgetAgorot(messages) {
  const patterns = [
    /(?:budget|under|below|up to|maximum|max|less than)\s*(?:is\s*)?(?:nis|₪)?\s*(\d+(?:\.\d{1,2})?)/i,
    /(?:nis|₪)\s*(\d+(?:\.\d{1,2})?)/i,
    /(\d+(?:\.\d{1,2})?)\s*(?:nis|shekels?|₪)/i,
  ];
  const userMessages = messages
    .filter((message) => message.role === "user")
    .map((message) => message.content)
    .reverse();
  for (const message of userMessages) {
    for (const pattern of patterns) {
      const amount = Number(message.match(pattern)?.[1]);
      if (Number.isFinite(amount)) {
        return Math.min(200000, Math.max(500, Math.round(amount * 100)));
      }
    }
  }
  return null;
}

function requestedDietaryTags(messages) {
  const userMessages = messages
    .filter((message) => message.role === "user")
    .map((message) => message.content)
    .reverse();
  for (const message of userMessages) {
    if (/\b(no dietary preference|not vegan|anything is fine)\b/i.test(message)) return [];
    const tags = [];
    if (/\bvegan\b/i.test(message)) tags.push("vegan");
    else if (/\bvegetarian\b/i.test(message)) tags.push("vegetarian");
    if (/\b(dairy[\s-]?free|no dairy)\b/i.test(message)) tags.push("dairy_free");
    if (tags.length) return tags;
  }
  return [];
}

function searchableWords(text) {
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .split(/\s+/)
    .filter((word) => word.length > 2 && !ignoredWords.has(word));
}

function requestedNeedType(messages) {
  const userMessages = messages
    .filter((message) => message.role === "user")
    .map((message) => message.content)
    .reverse();
  for (const message of userMessages) {
    const match = needPatterns.find((intent) => intent.pattern.test(message));
    if (match) return match.needType;
  }
  return null;
}

function requestedResultLimit(messages) {
  const latest = messages
    .filter((message) => message.role === "user")
    .at(-1)?.content ?? "";
  if (/\b(one|single|just one|best one)\b/i.test(latest) || /\b1\b/.test(latest)) return 1;
  if (/\b(two|couple)\b/i.test(latest) || /\b2\b/.test(latest)) return 2;
  return 3;
}

function localChatFallback(candidates, messages, orderHistory) {
  const text = chatText(messages);
  const budgetAgorot = requestedBudgetAgorot(messages);
  const dietaryTags = requestedDietaryTags(messages);
  const needType = requestedNeedType(messages);
  const resultLimit = requestedResultLimit(messages);
  const words = searchableWords(text);
  const historyByProductId = new Map(
    orderHistory.map((item) => [item.product_public_id, item]),
  );
  const historyNames = new Set(
    orderHistory.map((item) => item.product_name.toLowerCase()),
  );
  const eligible = candidates.filter((candidate) => {
    if (budgetAgorot && candidate.price_agorot > budgetAgorot) return false;
    if (needType && candidate.need_type !== needType) return false;
    return dietaryTags.every((tag) => candidate.dietary_tags.includes(tag));
  });

  const ranked = eligible
    .map((candidate) => {
      const haystack = [
        candidate.name,
        candidate.description,
        candidate.need_type,
        candidate.category_name,
        candidate.vendor_name,
        ...candidate.dietary_tags,
      ].join(" ").toLowerCase();
      const name = candidate.name.toLowerCase();
      const keywordScore = words.reduce((total, word) => (
        total + (name.includes(word) ? 6 : haystack.includes(word) ? 2 : 0)
      ), 0);
      let score = keywordScore;
      for (const intent of needPatterns) {
        if (intent.pattern.test(text) && candidate.need_type === intent.needType) score += 10;
      }
      const historyItem = historyByProductId.get(candidate.public_id);
      if (historyItem) {
        score += Math.min(6, 2 + Number(historyItem.times_ordered));
      } else if (historyNames.has(candidate.name.toLowerCase())) {
        score += 2;
      }
      return { candidate, score, keywordScore };
    })
    .sort((a, b) => (
      b.score - a.score
      || a.candidate.price_agorot - b.candidate.price_agorot
      || a.candidate.name.localeCompare(b.candidate.name)
    ));

  const directlyMatched = ranked.filter(({ keywordScore }) => keywordScore > 0);
  const hasPreference = Boolean(
    needType
    || dietaryTags.length
    || budgetAgorot
    || orderHistory.length,
  );
  const shortlist = (
    words.length && directlyMatched.length
      ? directlyMatched
      : hasPreference
        ? ranked
        : []
  ).slice(0, resultLimit);

  if (!shortlist.length) {
    if (!hasPreference && !words.length) {
      return {
        reply: "What are you in the mood for? Tell me a product, budget, or campus need and I will narrow it down.",
        recommendations: [],
        budgetAgorot,
      };
    }
    return {
      reply: "I could not find an available catalog item that matches every limit. Try a higher budget or a different preference.",
      recommendations: [],
      budgetAgorot,
    };
  }

  const budgetText = budgetAgorot
    ? ` within your NIS ${(budgetAgorot / 100).toFixed(2)} budget`
    : "";
  const previousMatch = shortlist.find(({ candidate }) => (
    historyByProductId.has(candidate.public_id)
    || historyNames.has(candidate.name.toLowerCase())
  ));
  const topic = words.slice(-2).join(" ") || needType;
  const firstProductName = shortlist[0]?.candidate.name;
  const sameProductAtDifferentVendors = shortlist.length > 1 && shortlist.every(
    ({ candidate }) => candidate.name.toLowerCase() === firstProductName.toLowerCase(),
  );
  let reply;
  if (previousMatch) {
    reply = `Since you ordered ${previousMatch.candidate.name} before, I included it again and found ${shortlist.length} matching option${shortlist.length === 1 ? "" : "s"}${budgetText}.`;
  } else if (sameProductAtDifferentVendors) {
    reply = `I found ${shortlist.length} ${firstProductName} options from different campus vendors, so you can choose the most convenient one${budgetText}.`;
  } else if (topic) {
    reply = `You asked for ${topic}, so I found ${shortlist.length} matching option${shortlist.length === 1 ? "" : "s"} currently available${budgetText}.`;
  } else {
    reply = `Based on your recent orders, I found ${shortlist.length} available option${shortlist.length === 1 ? "" : "s"} that may suit you.`;
  }

  return {
    reply,
    recommendations: shortlist.map(({ candidate }) => ({
      productId: candidate.public_id,
      reason: historyByProductId.has(candidate.public_id)
        ? `You ordered this before, and it is available again from ${candidate.vendor_name} for NIS ${(candidate.price_agorot / 100).toFixed(2)}.`
        : `${candidate.name} matches your request and is available from ${candidate.vendor_name} for NIS ${(candidate.price_agorot / 100).toFixed(2)}.`,
    })),
    budgetAgorot,
  };
}

function safeProductRecommendations(result, candidates) {
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

export async function recommend(user, input) {
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

  const safeRecommendations = safeProductRecommendations(result, candidates);

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

export async function chat(user, input) {
  const [candidates, orderHistory] = await Promise.all([
    listShoppingAssistantCandidates(),
    listCustomerShoppingHistory(user.id),
  ]);
  const fallbackResult = localChatFallback(candidates, input.messages, orderHistory);
  let result;
  let providerUsed = "fallback";

  try {
    result = await requestShoppingChat(
      input.messages,
      candidates.map((item) => ({
        productId: item.public_id,
        name: item.name,
        description: item.description,
        priceAgorot: item.price_agorot,
        needType: item.need_type,
        dietary: item.dietary_tags,
        allergenNotice: item.allergen_text,
        category: item.category_name,
        vendor: item.vendor_name,
      })),
      {
        recentOrders: orderHistory.map((item) => ({
          productName: item.product_name,
          needType: item.need_type,
          category: item.category_name,
          vendor: item.vendor_name,
          timesOrdered: Number(item.times_ordered),
          quantityOrdered: Number(item.quantity_ordered),
        })),
      },
    );
    providerUsed = "gemini";
  } catch {
    result = fallbackResult;
  }

  const safeRecommendations = safeProductRecommendations(result, candidates);
  await recordRecommendation({
    publicId: publicId(),
    userId: user.id,
    needType: "chat",
    budgetAgorot: fallbackResult.budgetAgorot ?? 0,
    providerUsed,
    outcome: "success",
    resultCount: safeRecommendations.length,
  });

  return {
    source: providerUsed,
    reply: String(result.reply ?? "Tell me what you are shopping for.").slice(0, 1200),
    recommendations: safeRecommendations,
    safetyNotice: "Check ingredients and allergen details with the vendor before ordering.",
  };
}
