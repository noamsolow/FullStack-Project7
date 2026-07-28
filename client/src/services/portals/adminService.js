import { apiRequest } from "../core/apiClient.js";

export const adminService = {
  users: (query = {}) => apiRequest("/admin/users", { query, cache: false }),
  setUserBlocked: (publicId, blocked) => apiRequest(
    `/admin/users/${publicId}/status`,
    {
      method: "PATCH",
      body: { blocked },
      invalidate: "/admin/users",
    },
  ),
  vendors: (query = {}) => apiRequest("/admin/vendors", { query, cache: false }),
  setVendorStatus: (publicId, status) => apiRequest(
    `/admin/vendors/${publicId}/status`,
    {
      method: "PATCH",
      body: { status },
      invalidate: "/admin/vendors",
    },
  ),
  buildings: () => apiRequest("/admin/buildings", { cache: false }),
  maintenance: (query = {}) => apiRequest("/admin/maintenance-tickets", {
    query,
    cache: false,
  }),
  maintenanceDetails: (publicId) => apiRequest(
    `/admin/maintenance-tickets/${publicId}`,
    { cache: false },
  ),
  updateMaintenance: (publicId, body) => apiRequest(
    `/admin/maintenance-tickets/${publicId}`,
    {
      method: "PATCH",
      body,
      invalidate: "/admin/maintenance-tickets",
    },
  ),
  commentMaintenance: (publicId, body) => apiRequest(
    `/admin/maintenance-tickets/${publicId}/comments`,
    {
      method: "POST",
      body,
      invalidate: "/admin/maintenance-tickets",
    },
  ),
  orders: (query = {}) => apiRequest("/admin/orders", { query, cache: false }),
  order: (publicId) => apiRequest(`/admin/orders/${publicId}`, { cache: false }),
  audit: (query = {}) => apiRequest("/admin/audit", { query, cache: false }),
};
