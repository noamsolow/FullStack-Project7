import { apiRequest } from "../core/apiClient.js";

export const recommendationService = {
  recommend: (body) => apiRequest("/recommendations", {
    method: "POST",
    body,
  }),
};
