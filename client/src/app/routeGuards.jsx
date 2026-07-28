import { Navigate, useLocation } from "react-router-dom";
import { LoadingState } from "../components/ui/PageState.jsx";
import { useAuth } from "../features/auth/AuthContext.jsx";

export function RequireAuth({ children, role = "customer" }) {
  const { user, checking } = useAuth();
  const location = useLocation();
  if (checking) return <LoadingState label="Checking your session..." />;
  if (!user) {
    const target = role === "vendor_manager"
      ? "/partner/login"
      : role === "admin"
        ? "/admin/login"
        : "/login";
    return <Navigate to={target} state={{ from: location }} replace />;
  }
  if (user.role !== role) {
    const target = user.role === "vendor_manager"
      ? "/partner"
      : user.role === "admin"
        ? "/admin"
        : "/";
    return <Navigate to={target} replace />;
  }
  return children;
}

export function GuestOnly({ children }) {
  const { user, checking } = useAuth();
  const location = useLocation();
  if (checking) return <LoadingState label="Checking your session..." />;
  if (!user) return children;
  const requestedLocation = location.state?.from;
  if (requestedLocation) {
    return (
      <Navigate
        to={{
          pathname: requestedLocation.pathname,
          search: requestedLocation.search,
          hash: requestedLocation.hash,
        }}
        replace
      />
    );
  }
  const target = user.role === "admin"
    ? "/admin"
    : user.role === "vendor_manager"
      ? "/partner"
      : "/";
  return <Navigate to={target} replace />;
}
