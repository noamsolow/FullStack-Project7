import { apiRequest } from "./apiClient.js";

export const catalogService = {
  buildings: (query = {}) => apiRequest("/buildings", { query }),
  categories: (group) => apiRequest("/categories", { query: { group } }),
  vendors: (query = {}) => apiRequest("/vendors", { query }),
  vendor: (slug) => apiRequest(`/vendors/${slug}`),
  products: (slug, query = {}) => apiRequest(`/vendors/${slug}/products`, { query }),
  printCenters: () => apiRequest("/print-centers"),
};

