import { apiRequest } from "../core/apiClient.js";

export const recommendationService = {
  recommend: (body) => apiRequest("/recommendations", {
    method: "POST",
    body,
  }),
  chat: (messages) => apiRequest("/recommendations/chat", {
    method: "POST",
    body: { messages },
    timeoutMs: 20_000,
  }),
};
