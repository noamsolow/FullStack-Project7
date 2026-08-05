import { createBrowserRouter, Navigate } from "react-router-dom";
import { AdminLayout } from "../layouts/AdminLayout.jsx";
import { PartnerLayout } from "../layouts/PartnerLayout.jsx";
import { PublicLayout } from "../layouts/PublicLayout.jsx";
import { AccountPage } from "../pages/account/AccountPage.jsx";
import { AdminAuditPage } from "../pages/admin/AdminAuditPage.jsx";
import { AdminDashboardPage } from "../pages/admin/AdminDashboardPage.jsx";
import { AdminMaintenancePage } from "../pages/admin/AdminMaintenancePage.jsx";
import { AdminOrdersPage } from "../pages/admin/AdminOrdersPage.jsx";
import { AdminUsersPage } from "../pages/admin/AdminUsersPage.jsx";
import { AdminVendorsPage } from "../pages/admin/AdminVendorsPage.jsx";
import { AuthPage } from "../pages/auth/AuthPage.jsx";
import { VendorPage } from "../pages/commerce/catalog/VendorPage.jsx";
import { CartPage } from "../pages/commerce/checkout/CartPage.jsx";
import { PaymentReturnPage } from "../pages/commerce/checkout/PaymentReturnPage.jsx";
import { OrderDetailPage } from "../pages/commerce/orders/OrderDetailPage.jsx";
import { OrdersPage } from "../pages/commerce/orders/OrdersPage.jsx";
import { RecommendationPage } from "../pages/commerce/recommendations/RecommendationPage.jsx";
import { MaintenanceDetailPage } from "../pages/maintenance/MaintenanceDetailPage.jsx";
import { MaintenancePage } from "../pages/maintenance/MaintenancePage.jsx";
import { PartnerDashboardPage } from "../pages/partner/PartnerDashboardPage.jsx";
import { PartnerOrdersPage } from "../pages/partner/PartnerOrdersPage.jsx";
import { PartnerPrintJobsPage } from "../pages/partner/PartnerPrintJobsPage.jsx";
import { PartnerProductsPage } from "../pages/partner/PartnerProductsPage.jsx";
import { PartnerSettingsPage } from "../pages/partner/PartnerSettingsPage.jsx";
import { PrintJobDetailPage } from "../pages/printing/PrintJobDetailPage.jsx";
import { PrintJobsPage } from "../pages/printing/PrintJobsPage.jsx";
import { PrintPage } from "../pages/printing/PrintPage.jsx";
import { HomePage } from "../pages/public/HomePage.jsx";
import { NotFoundPage } from "../pages/public/NotFoundPage.jsx";
import { ServicesPage } from "../pages/public/ServicesPage.jsx";
import { GuestOnly, RequireAuth } from "./routeGuards.jsx";

const customer = (element) => <RequireAuth>{element}</RequireAuth>;

export const router = createBrowserRouter([
  {
    element: <PublicLayout />,
    children: [
      { path: "/", element: <HomePage /> },
      { path: "/services", element: customer(<ServicesPage />) },
      { path: "/eat", element: <Navigate to="/services#food" replace /> },
      { path: "/shop", element: <Navigate to="/services#office" replace /> },
      { path: "/vendors/:slug", element: <VendorPage /> },
      { path: "/cart", element: customer(<CartPage />) },
      { path: "/payment/return", element: customer(<PaymentReturnPage />) },
      { path: "/payment/cancel", element: customer(<PaymentReturnPage cancelled />) },
      { path: "/recommend", element: customer(<RecommendationPage />) },
      { path: "/print", element: customer(<PrintPage />) },
      { path: "/print/jobs", element: customer(<PrintJobsPage />) },
      { path: "/print/:publicId", element: customer(<PrintJobDetailPage />) },
      { path: "/report", element: customer(<MaintenancePage />) },
      { path: "/report/:publicId", element: customer(<MaintenanceDetailPage />) },
      { path: "/orders", element: customer(<OrdersPage />) },
      { path: "/orders/:publicId", element: customer(<OrderDetailPage />) },
      { path: "/account", element: customer(<AccountPage />) },
      { path: "*", element: <NotFoundPage /> },
    ],
  },
  {
    path: "/login",
    element: <GuestOnly><AuthPage /></GuestOnly>,
  },
  {
    path: "/register",
    element: <GuestOnly><AuthPage mode="register" /></GuestOnly>,
  },
  {
    path: "/partner/login",
    element: <GuestOnly role="vendor_manager"><AuthPage portal="partner" /></GuestOnly>,
  },
  {
    path: "/partner/register",
    element: <GuestOnly role="vendor_manager"><AuthPage portal="partner" mode="register" /></GuestOnly>,
  },
  {
    path: "/admin/login",
    element: <GuestOnly role="admin"><AuthPage portal="admin" /></GuestOnly>,
  },
  {
    path: "/partner",
    element: <RequireAuth role="vendor_manager"><PartnerLayout /></RequireAuth>,
    children: [
      { index: true, element: <PartnerDashboardPage /> },
      { path: "products", element: <PartnerProductsPage /> },
      { path: "orders", element: <PartnerOrdersPage /> },
      { path: "print-jobs", element: <PartnerPrintJobsPage /> },
      { path: "settings", element: <PartnerSettingsPage /> },
    ],
  },
  {
    path: "/admin",
    element: <RequireAuth role="admin"><AdminLayout /></RequireAuth>,
    children: [
      { index: true, element: <AdminDashboardPage /> },
      { path: "orders", element: <AdminOrdersPage /> },
      { path: "maintenance", element: <AdminMaintenancePage /> },
      { path: "users", element: <AdminUsersPage /> },
      { path: "vendors", element: <AdminVendorsPage /> },
      { path: "audit", element: <AdminAuditPage /> },
    ],
  },
]);
