import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";

const CART_KEY = "levgo.cart.v2";
const CartContext = createContext(null);

function readCart() {
  try {
    const value = localStorage.getItem(CART_KEY);
    return value ? JSON.parse(value) : { vendor: null, items: [] };
  } catch {
    return { vendor: null, items: [] };
  }
}

export function CartProvider({ children }) {
  const [cart, setCartState] = useState(readCart);

  const save = useCallback((next) => {
    setCartState(next);
    localStorage.setItem(CART_KEY, JSON.stringify(next));
  }, []);

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

