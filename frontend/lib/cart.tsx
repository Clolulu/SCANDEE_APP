import React, { createContext, useContext, useEffect, useMemo, useReducer, useState } from 'react';

export interface CartItem {
  vendorId: number;
  productId: number;
  productName: string;
  productPrice: number;
  quantity: number;
  image?: string | null;
}

interface CartState {
  vendorId: number | null;
  items: CartItem[];
}

type CartAction =
  | { type: 'LOAD_CART'; payload: CartState }
  | { type: 'ADD_ITEM'; payload: CartItem }
  | { type: 'UPDATE_ITEM'; payload: { productId: number; quantity: number } }
  | { type: 'REMOVE_ITEM'; payload: { productId: number } }
  | { type: 'CLEAR_CART' };

interface CartContextValue {
  cart: CartState;
  subtotal: number;
  totalQuantity: number;
  addItem: (item: CartItem) => void;
  updateItem: (productId: number, quantity: number) => void;
  removeItem: (productId: number) => void;
  clearCart: () => void;
  clear: () => void;
  total: number;
}

const CART_STORAGE_KEY = 'scandee_cart';
const defaultState: CartState = { vendorId: null, items: [] };
const CartContext = createContext<CartContextValue | undefined>(undefined);

const cartReducer = (state: CartState, action: CartAction): CartState => {
  switch (action.type) {
    case 'LOAD_CART':
      return action.payload;
    case 'ADD_ITEM': {
      const item = action.payload;
      if (state.vendorId && state.vendorId !== item.vendorId) {
        return { vendorId: item.vendorId, items: [item] };
      }

      const existing = state.items.find((cartItem) => cartItem.productId === item.productId);
      if (existing) {
        return {
          vendorId: item.vendorId,
          items: state.items.map((cartItem) =>
            cartItem.productId === item.productId
              ? { ...cartItem, quantity: cartItem.quantity + item.quantity }
              : cartItem,
          ),
        };
      }

      return {
        vendorId: item.vendorId,
        items: [...state.items, item],
      };
    }
    case 'UPDATE_ITEM':
      return {
        vendorId: state.vendorId,
        items: state.items
          .map((item) =>
            item.productId === action.payload.productId
              ? { ...item, quantity: action.payload.quantity }
              : item,
          )
          .filter((item) => item.quantity > 0),
      };
    case 'REMOVE_ITEM':
      return {
        vendorId: state.vendorId,
        items: state.items.filter((item) => item.productId !== action.payload.productId),
      };
    case 'CLEAR_CART':
      return defaultState;
    default:
      return state;
  }
};

const loadCart = (): CartState => {
  if (typeof window === 'undefined') return defaultState;
  try {
    const stored = window.localStorage.getItem(CART_STORAGE_KEY);
    if (!stored) return defaultState;
    return JSON.parse(stored) as CartState;
  } catch {
    return defaultState;
  }
};

const saveCart = (cart: CartState) => {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
};

export const CartProvider = ({ children }: { children: React.ReactNode }) => {
  const [cart, dispatch] = useReducer(cartReducer, defaultState, () => {
    if (typeof window === 'undefined') return defaultState;
    return loadCart();
  });
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    setInitialized(true);
  }, []);

  useEffect(() => {
    if (!initialized) return;
    saveCart(cart);
  }, [cart, initialized]);

  const subtotal = useMemo(
    () => cart.items.reduce((sum, item) => sum + item.productPrice * item.quantity, 0),
    [cart.items],
  );

  const totalQuantity = useMemo(
    () => cart.items.reduce((sum, item) => sum + item.quantity, 0),
    [cart.items],
  );

  const addItem = (item: CartItem) => {
    if (cart.vendorId && cart.vendorId !== item.vendorId) {
      const canClear = typeof window !== 'undefined'
        ? window.confirm('Your cart contains items from another vendor. Clear current cart and continue?')
        : false;
      if (!canClear) return;
      dispatch({ type: 'CLEAR_CART' });
    }
    dispatch({ type: 'ADD_ITEM', payload: item });
  };

  const updateItem = (productId: number, quantity: number) => {
    dispatch({ type: 'UPDATE_ITEM', payload: { productId, quantity } });
  };

  const removeItem = (productId: number) => {
    dispatch({ type: 'REMOVE_ITEM', payload: { productId } });
  };

  const clearCart = () => {
    dispatch({ type: 'CLEAR_CART' });
  };

  return (
    <CartContext.Provider
      value={{
        cart,
        subtotal,
        totalQuantity,
        addItem,
        updateItem,
        removeItem,
        clearCart,
        clear: clearCart,
        total: subtotal,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
