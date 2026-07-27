import { apiRequest } from "./apiClient.js";

export const printService = {
  list: (query = {}) => apiRequest("/print-jobs", { query, cache: false }),
  details: (publicId) => apiRequest(`/print-jobs/${publicId}`, { cache: false }),
  submit: (formData) => apiRequest("/print-jobs", {
    method: "POST",
    body: formData,
    invalidate: "/print-jobs",
    timeoutMs: 25_000,
  }),
  checkout: (publicId) => apiRequest(`/print-jobs/${publicId}/payment`, {
    method: "POST",
    invalidate: "/print-jobs",
  }),
  capture: (publicId, providerOrderId) => apiRequest(
    `/print-jobs/${publicId}/payment/capture`,
    {
      method: "POST",
      body: { providerOrderId },
      invalidate: "/print-jobs",
    },
  ),
  cancel: (publicId, reason) => apiRequest(
    `/print-jobs/${publicId}/cancellation-requests`,
    {
      method: "POST",
      body: { reason },
      invalidate: "/print-jobs",
    },
  ),
};

