import { apiRequest } from "../core/apiClient.js";

export const authService = {
  registerCustomer: (body) => apiRequest("/auth/customer/register", {
    method: "POST",
    body,
  }),
  registerPartner: (body) => apiRequest("/auth/partner/register", {
    method: "POST",
    body,
  }),
  loginCustomer: (body) => apiRequest("/auth/customer/login", {
    method: "POST",
    body,
  }),
  loginPartner: (body) => apiRequest("/auth/partner/login", {
    method: "POST",
    body,
  }),
  loginAdmin: (body) => apiRequest("/auth/admin/login", {
    method: "POST",
    body,
  }),
  logout: () => apiRequest("/auth/logout", { method: "POST" }),
  me: () => apiRequest("/auth/me", { cache: false }),
  spending: () => apiRequest("/auth/me/spending", { cache: false }),
  updateMe: (body) => apiRequest("/auth/me", {
    method: "PATCH",
    body,
    invalidate: "/auth/me",
  }),
};
