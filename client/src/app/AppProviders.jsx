import { AuthProvider } from "../features/auth/AuthContext.jsx";
import { CartProvider } from "../features/cart/CartContext.jsx";

export function AppProviders({ children }) {
  return (
    <AuthProvider>
      <CartProvider>{children}</CartProvider>
    </AuthProvider>
  );
}

