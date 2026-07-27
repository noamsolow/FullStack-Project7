import { apiRequest } from "./apiClient.js";

export const recommendationService = {
  recommend: (body) => apiRequest("/recommendations", {
    method: "POST",
    body,
  }),
};

