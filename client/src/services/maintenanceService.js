import { apiRequest } from "./apiClient.js";

export const maintenanceService = {
  list: (query = {}) => apiRequest("/maintenance-tickets", {
    query,
    cache: false,
  }),
  details: (publicId) => apiRequest(`/maintenance-tickets/${publicId}`, {
    cache: false,
  }),
  create: (formData) => apiRequest("/maintenance-tickets", {
    method: "POST",
    body: formData,
    invalidate: "/maintenance-tickets",
    timeoutMs: 20_000,
  }),
  comment: (publicId, body) => apiRequest(
    `/maintenance-tickets/${publicId}/comments`,
    {
      method: "POST",
      body,
      invalidate: "/maintenance-tickets",
    },
  ),
};

