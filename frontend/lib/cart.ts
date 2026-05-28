import { useEffect, useMemo, useState } from 'react';

export interface CartItem {
  vendorId: number;
  productId: number;
  name: string;
  price: number;
  quantity: number;
}

interface CartState {
  vendorId: number | null;
  items: CartItem[];
}

const CART_STORAGE_KEY = 'scandee_cart';

const defaultState: CartState = {
  vendorId: null,
  items: [],
};

export const loadCart = (): CartState => {
  if (typeof window === 'undefined') return defaultState;
  try {
    const stored = window.localStorage.getItem(CART_STORAGE_KEY);
    if (!stored) return defaultState;
    return JSON.parse(stored) as CartState;
  } catch {
    return defaultState;
  }
};

export const saveCart = (cart: CartState) => {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
};

export const clearCartStorage = () => {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(CART_STORAGE_KEY);
};

export function useCart() {
  const [state, setState] = useState<CartState>(defaultState);
  const initialized = useRef(false);

  useEffect(() => {
    setState(loadCart());
    initialized.current = true;
  }, []);

  useEffect(() => {
    if (!initialized.current) return;
    saveCart(state);
  }, [state]);

  const addItem = (item: CartItem) => {
    setState((current) => {
      if (current.vendorId && current.vendorId !== item.vendorId) {
        return { vendorId: item.vendorId, items: [item] };
      }

      const existing = current.items.find((cartItem) => cartItem.productId === item.productId);
      if (existing) {
        return {
          vendorId: item.vendorId,
          items: current.items.map((cartItem) =>
            cartItem.productId === item.productId
              ? { ...cartItem, quantity: cartItem.quantity + item.quantity }
              : cartItem,
          ),
        };
      }

      return {
        vendorId: item.vendorId,
        items: [...current.items, item],
      };
    });
  };

  const updateItem = (productId: number, quantity: number) => {
    setState((current) => ({
      vendorId: current.vendorId,
      items: current.items
        .map((item) => (item.productId === productId ? { ...item, quantity } : item))
        .filter((item) => item.quantity > 0),
    }));
  };

  const removeItem = (productId: number) => {
    setState((current) => ({
      vendorId: current.vendorId,
      items: current.items.filter((item) => item.productId !== productId),
    }));
  };

  const clear = () => {
    setState(defaultState);
    clearCartStorage();
  };

  const total = useMemo(
    () => state.items.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [state.items],
  );

  return { cart: state, addItem, updateItem, removeItem, clear, total };
}
