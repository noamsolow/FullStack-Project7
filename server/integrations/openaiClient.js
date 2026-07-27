import { config } from "../config/index.js";
import { AppError } from "../utils/AppError.js";

function outputText(response) {
  for (const item of response.output ?? []) {
    for (const content of item.content ?? []) {
      if (content.type === "output_text" && typeof content.text === "string") {
        return content.text;
      }
    }
  }
  return null;
}

export async function requestRecommendations(preferences, candidates) {
  if (!config.openai.apiKey) {
    throw new AppError(
      503,
      "AI_NOT_CONFIGURED",
      "AI recommendations are not configured",
    );
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), config.openai.timeoutMs);
  let response;
  try {
    response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      signal: controller.signal,
      headers: {
        Authorization: `Bearer ${config.openai.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: config.openai.model,
        reasoning: { effort: "low" },
        store: false,
        instructions: [
          "You recommend up to three LevGo campus catalog products.",
          "Use only product IDs provided in the catalog.",
          "Respect the budget and preferences.",
          "Never claim an item is allergen-safe.",
          "Do not suggest maintenance actions, payments, or cart changes.",
        ].join(" "),
        input: JSON.stringify({ preferences, catalog: candidates }),
        text: {
          format: {
            type: "json_schema",
            name: "levgo_recommendations",
            strict: true,
            schema: {
              type: "object",
              additionalProperties: false,
              properties: {
                summary: { type: "string" },
                recommendations: {
                  type: "array",
                  maxItems: 3,
                  items: {
                    type: "object",
                    additionalProperties: false,
                    properties: {
                      productId: { type: "string" },
                      reason: { type: "string" },
                    },
                    required: ["productId", "reason"],
                  },
                },
              },
              required: ["summary", "recommendations"],
            },
          },
        },
      }),
    });
  } catch (error) {
    if (error.name === "AbortError") {
      throw new AppError(504, "AI_TIMEOUT", "Recommendations took too long");
    }
    throw new AppError(502, "AI_UNAVAILABLE", "Recommendations are temporarily unavailable");
  } finally {
    clearTimeout(timeout);
  }

  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new AppError(
      502,
      "AI_PROVIDER_ERROR",
      "Recommendations are temporarily unavailable",
    );
  }

  const text = outputText(body);
  if (!text) {
    throw new AppError(502, "AI_INVALID_RESPONSE", "The recommendation response was incomplete");
  }

  try {
    return JSON.parse(text);
  } catch {
    throw new AppError(502, "AI_INVALID_RESPONSE", "The recommendation response was invalid");
  }
}

