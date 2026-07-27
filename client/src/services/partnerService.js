import { apiRequest } from "./apiClient.js";

export const partnerService = {
  vendor: () => apiRequest("/partner/vendor", { cache: false }),
  updateVendor: (body) => apiRequest("/partner/vendor", {
    method: "PATCH",
    body,
    invalidate: "/partner",
  }),
  products: (query = {}) => apiRequest("/partner/products", {
    query,
    cache: false,
  }),
  createProduct: (body) => apiRequest("/partner/products", {
    method: "POST",
    body,
    invalidate: "/partner/products",
  }),
  updateProduct: (publicId, body) => apiRequest(`/partner/products/${publicId}`, {
    method: "PUT",
    body,
    invalidate: "/partner/products",
  }),
  deleteProduct: (publicId) => apiRequest(`/partner/products/${publicId}`, {
    method: "DELETE",
    invalidate: "/partner/products",
  }),
  uploadProductImage: (publicId, formData) => apiRequest(
    `/partner/products/${publicId}/images`,
    {
      method: "POST",
      body: formData,
      invalidate: "/partner/products",
    },
  ),
  orders: (query = {}) => apiRequest("/partner/orders", { query, cache: false }),
  order: (publicId) => apiRequest(`/partner/orders/${publicId}`, { cache: false }),
  updateOrder: (publicId, body) => apiRequest(`/partner/orders/${publicId}/status`, {
    method: "PATCH",
    body,
    invalidate: "/partner/orders",
  }),
  printJobs: (query = {}) => apiRequest("/partner/print-jobs", {
    query,
    cache: false,
  }),
  printJob: (publicId) => apiRequest(`/partner/print-jobs/${publicId}`, {
    cache: false,
  }),
  quotePrint: (publicId, body) => apiRequest(
    `/partner/print-jobs/${publicId}/quote`,
    {
      method: "PATCH",
      body,
      invalidate: "/partner/print-jobs",
    },
  ),
  updatePrint: (publicId, body) => apiRequest(
    `/partner/print-jobs/${publicId}/status`,
    {
      method: "PATCH",
      body,
      invalidate: "/partner/print-jobs",
    },
  ),
  deliveryZones: () => apiRequest("/partner/delivery-zones", { cache: false }),
  saveDeliveryZone: (body) => apiRequest("/partner/delivery-zones", {
    method: "PUT",
    body,
    invalidate: "/partner/delivery-zones",
  }),
};

