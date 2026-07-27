import { createBrowserRouter } from "react-router-dom";
import { AdminLayout } from "../layouts/AdminLayout.jsx";
import { PartnerLayout } from "../layouts/PartnerLayout.jsx";
import { PublicLayout } from "../layouts/PublicLayout.jsx";
import { AccountPage } from "../pages/AccountPage.jsx";
import { AdminAuditPage } from "../pages/AdminAuditPage.jsx";
import { AdminDashboardPage } from "../pages/AdminDashboardPage.jsx";
import { AdminMaintenancePage } from "../pages/AdminMaintenancePage.jsx";
import { AdminUsersPage } from "../pages/AdminUsersPage.jsx";
import { AdminVendorsPage } from "../pages/AdminVendorsPage.jsx";
import { AuthPage } from "../pages/AuthPage.jsx";
import { CartPage } from "../pages/CartPage.jsx";
import { DiscoverPage } from "../pages/DiscoverPage.jsx";
import { HomePage } from "../pages/HomePage.jsx";
import { MaintenanceDetailPage } from "../pages/MaintenanceDetailPage.jsx";
import { MaintenancePage } from "../pages/MaintenancePage.jsx";
import { NotFoundPage } from "../pages/NotFoundPage.jsx";
import { OrderDetailPage } from "../pages/OrderDetailPage.jsx";
import { OrdersPage } from "../pages/OrdersPage.jsx";
import { PartnerDashboardPage } from "../pages/PartnerDashboardPage.jsx";
import { PartnerOrdersPage } from "../pages/PartnerOrdersPage.jsx";
import { PartnerPrintJobsPage } from "../pages/PartnerPrintJobsPage.jsx";
import { PartnerProductsPage } from "../pages/PartnerProductsPage.jsx";
import { PartnerSettingsPage } from "../pages/PartnerSettingsPage.jsx";
import { PaymentReturnPage } from "../pages/PaymentReturnPage.jsx";
import { PrintJobDetailPage } from "../pages/PrintJobDetailPage.jsx";
import { PrintJobsPage } from "../pages/PrintJobsPage.jsx";
import { PrintPage } from "../pages/PrintPage.jsx";
import { RecommendationPage } from "../pages/RecommendationPage.jsx";
import { VendorPage } from "../pages/VendorPage.jsx";
import { GuestOnly, RequireAuth } from "./routeGuards.jsx";

const customer = (element) => <RequireAuth>{element}</RequireAuth>;

export const router = createBrowserRouter([
  {
    element: <PublicLayout />,
    children: [
      { path: "/", element: <HomePage /> },
      { path: "/eat", element: <DiscoverPage group="eat" /> },
      { path: "/shop", element: <DiscoverPage group="shop" /> },
      { path: "/vendors/:slug", element: <VendorPage /> },
      { path: "/cart", element: <CartPage /> },
      { path: "/recommend", element: customer(<RecommendationPage />) },
      { path: "/print", element: customer(<PrintPage />) },
      { path: "/print/jobs", element: customer(<PrintJobsPage />) },
      { path: "/print/:publicId", element: customer(<PrintJobDetailPage />) },
      { path: "/report", element: customer(<MaintenancePage />) },
      { path: "/report/:publicId", element: customer(<MaintenanceDetailPage />) },
      { path: "/orders", element: customer(<OrdersPage />) },
      { path: "/orders/:publicId", element: customer(<OrderDetailPage />) },
      { path: "/account", element: customer(<AccountPage />) },
      { path: "/payment/return", element: customer(<PaymentReturnPage />) },
      { path: "/payment/cancel", element: customer(<PaymentReturnPage cancelled />) },
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
      { path: "maintenance", element: <AdminMaintenancePage /> },
      { path: "users", element: <AdminUsersPage /> },
      { path: "vendors", element: <AdminVendorsPage /> },
      { path: "audit", element: <AdminAuditPage /> },
    ],
  },
]);
