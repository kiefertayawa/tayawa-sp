// ============================================================
// PAMILI - Cart Context
// Global cart state. Replace localStorage with a cart API
// endpoint when you want server-side persistence.
// ============================================================

import { createContext, useContext, useReducer, useEffect } from 'react';
import type { CartItem } from '../types';

interface CartState {
  items: CartItem[];
}

type CartAction =
  | { type: 'ADD_ITEM'; payload: Omit<CartItem, 'quantity'> }
  | { type: 'UPDATE_QUANTITY'; payload: { productId: string; storeId: string; quantity: number } }
  | { type: 'REMOVE_ITEM'; payload: { productId: string; storeId: string } }
  | { type: 'CLEAR_CART' }
  | { type: 'LOAD_CART'; payload: CartItem[] };

function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case 'ADD_ITEM': {
      const existing = state.items.find(
        (i) => i.productId === action.payload.productId && i.storeId === action.payload.storeId
      );
      if (existing) {
        return {
          items: state.items.map((i) =>
            i.productId === action.payload.productId && i.storeId === action.payload.storeId
              ? { ...i, quantity: i.quantity + 1 }
              : i
          ),
        };
      }
      return { items: [...state.items, { ...action.payload, quantity: 1 }] };
    }
    case 'UPDATE_QUANTITY': {
      const { productId, storeId, quantity } = action.payload;
      if (quantity <= 0) {
        return {
          items: state.items.filter(
            (i) => !(i.productId === productId && i.storeId === storeId)
          ),
        };
      }
      return {
        items: state.items.map((i) =>
          i.productId === productId && i.storeId === storeId ? { ...i, quantity } : i
        ),
      };
    }
    case 'REMOVE_ITEM':
      return {
        items: state.items.filter(
          (i) => !(i.productId === action.payload.productId && i.storeId === action.payload.storeId)
        ),
      };
    case 'CLEAR_CART':
      return { items: [] };
    case 'LOAD_CART':
      return { items: action.payload };
    default:
      return state;
  }
}

interface CartContextValue extends CartState {
  addItem: (item: Omit<CartItem, 'quantity'>) => void;
  updateQuantity: (productId: string, storeId: string, quantity: number) => void;
  removeItem: (productId: string, storeId: string) => void;
  clearCart: () => void;
  totalItems: number;
  subtotal: number;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(cartReducer, { items: [] });

  // Persist cart to localStorage (swap for API call when backend is ready)
  useEffect(() => {
    const saved = localStorage.getItem('pamili_cart');
    if (saved) {
      try {
        dispatch({ type: 'LOAD_CART', payload: JSON.parse(saved) });
      } catch {}
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('pamili_cart', JSON.stringify(state.items));
  }, [state.items]);

  const totalItems = state.items.reduce((sum, i) => sum + i.quantity, 0);
  const subtotal = state.items.reduce((sum, i) => sum + i.price * i.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        ...state,
        addItem: (item) => dispatch({ type: 'ADD_ITEM', payload: item }),
        updateQuantity: (productId, storeId, quantity) =>
          dispatch({ type: 'UPDATE_QUANTITY', payload: { productId, storeId, quantity } }),
        removeItem: (productId, storeId) =>
          dispatch({ type: 'REMOVE_ITEM', payload: { productId, storeId } }),
        clearCart: () => dispatch({ type: 'CLEAR_CART' }),
        totalItems,
        subtotal,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used inside CartProvider');
  return ctx;
}
