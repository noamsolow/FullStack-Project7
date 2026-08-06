import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useAuth } from "../auth/AuthContext.jsx";

const LEGACY_CART_KEY = "levgo.cart.v2";
const CART_KEY_PREFIX = "levgo.cart.v3";
const EMPTY_CART = { vendor: null, items: [] };
const CartContext = createContext(null);

function cartKey(userPublicId) {
  return userPublicId ? `${CART_KEY_PREFIX}:${userPublicId}` : null;
}

function readCart(userPublicId) {
  const key = cartKey(userPublicId);
  if (!key) return EMPTY_CART;
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : EMPTY_CART;
  } catch {
    return EMPTY_CART;
  }
}

export function CartProvider({ children }) {
  const { user, checking } = useAuth();
  const userPublicId = user?.publicId ?? null;
  const [cartState, setCartState] = useState(() => ({
    ownerPublicId: userPublicId,
    cart: readCart(userPublicId),
  }));
  const cart = cartState.ownerPublicId === userPublicId
    ? cartState.cart
    : EMPTY_CART;

  useEffect(() => {
    localStorage.removeItem(LEGACY_CART_KEY);
  }, []);

  useEffect(() => {
    if (checking) return;
    setCartState({
      ownerPublicId: userPublicId,
      cart: readCart(userPublicId),
    });
  }, [checking, userPublicId]);

  const save = useCallback((next) => {
    const key = cartKey(userPublicId);
    if (!key) {
      setCartState({ ownerPublicId: null, cart: EMPTY_CART });
      return;
    }
    setCartState({ ownerPublicId: userPublicId, cart: next });
    localStorage.setItem(key, JSON.stringify(next));
  }, [userPublicId]);

  const addItem = useCallback((product, vendor, replace = false) => {
    if (cart.vendor && cart.vendor.publicId !== vendor.publicId && !replace) {
      return false;
    }
    const base = replace || !cart.vendor
      ? { vendor, items: [] }
      : cart;
    const existing = base.items.find((item) => item.public_id === product.public_id);
    const items = existing
      ? base.items.map((item) => item.public_id === product.public_id
        ? { ...item, quantity: Math.min(item.quantity + 1, 20) }
        : item)
      : [...base.items, { ...product, quantity: 1 }];
    save({ vendor: base.vendor, items });
    return true;
  }, [cart, save]);

  const setQuantity = useCallback((productId, quantity) => {
    const items = quantity <= 0
      ? cart.items.filter((item) => item.public_id !== productId)
      : cart.items.map((item) => item.public_id === productId
        ? { ...item, quantity: Math.min(quantity, 20) }
        : item);
    save({ vendor: items.length ? cart.vendor : null, items });
  }, [cart, save]);

  const clear = useCallback(() => save({ vendor: null, items: [] }), [save]);
  const count = cart.items.reduce((sum, item) => sum + item.quantity, 0);
  const subtotalAgorot = cart.items.reduce(
    (sum, item) => sum + item.price_agorot * item.quantity,
    0,
  );

  const value = useMemo(() => ({
    ...cart,
    count,
    subtotalAgorot,
    addItem,
    setQuantity,
    clear,
  }), [addItem, cart, clear, count, setQuantity, subtotalAgorot]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const value = useContext(CartContext);
  if (!value) throw new Error("useCart must be used inside CartProvider");
  return value;
}

