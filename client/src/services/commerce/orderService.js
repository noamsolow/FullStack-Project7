import { apiRequest } from "../core/apiClient.js";

export const orderService = {
  checkoutOptions: () => apiRequest("/orders/checkout/options", { cache: false }),
  list: (query = {}) => apiRequest("/orders", { query, cache: false }),
  progress: (query = {}) => apiRequest("/orders/progress", { query, cache: false }),
  details: (publicId) => apiRequest(`/orders/${publicId}`, { cache: false }),
  checkout: (body) => apiRequest("/orders/checkout", {
    method: "POST",
    body,
    invalidate: "/orders",
  }),
  capture: (publicId, providerOrderId) => apiRequest(
    `/orders/${publicId}/payment/capture`,
    {
      method: "POST",
      body: { providerOrderId },
      invalidate: "/orders",
    },
  ),
  cancel: (publicId, reason) => apiRequest(
    `/orders/${publicId}/cancellation-requests`,
    {
      method: "POST",
      body: { reason },
      invalidate: "/orders",
    },
  ),
  complete: (publicId) => apiRequest(`/orders/${publicId}/completion`, {
    method: "POST",
    invalidate: "/orders",
  }),
};
