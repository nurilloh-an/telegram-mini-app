import { createContext, useContext, useMemo, useReducer } from "react";
import type { CartItem, Product } from "../types";

type CartAction =
  | { type: "add"; product: Product }
  | { type: "remove"; productId: number }
  | { type: "set"; product: Product; quantity: number }
  | { type: "clear" };

interface CartState {
  items: CartItem[];
}

const CartContext = createContext<{
  state: CartState;
  addToCart: (product: Product) => void;
  removeFromCart: (productId: number) => void;
  setQuantity: (product: Product, quantity: number) => void;
  clearCart: () => void;
  totalPrice: number;
} | null>(null);

const reducer = (state: CartState, action: CartAction): CartState => {
  switch (action.type) {
    case "add": {
      const existing = state.items.find((item) => item.product.id === action.product.id);
      if (existing) {
        return {
          items: state.items.map((item) =>
            item.product.id === action.product.id
              ? { ...item, quantity: item.quantity + 1 }
              : item,
          ),
        };
      }
      return { items: [...state.items, { product: action.product, quantity: 1 }] };
    }
    case "remove": {
      return { items: state.items.filter((item) => item.product.id !== action.productId) };
    }
    case "set": {
      if (action.quantity <= 0) {
        return { items: state.items.filter((item) => item.product.id !== action.product.id) };
      }
      const exists = state.items.some((item) => item.product.id === action.product.id);
      if (!exists) {
        return { items: [...state.items, { product: action.product, quantity: action.quantity }] };
      }
      return {
        items: state.items.map((item) =>
          item.product.id === action.product.id ? { ...item, quantity: action.quantity } : item,
        ),
      };
    }
    case "clear":
      return { items: [] };
    default:
      return state;
  }
};

const initialState: CartState = { items: [] };

export const CartProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const [state, dispatch] = useReducer(reducer, initialState);

  const addToCart = (product: Product) => dispatch({ type: "add", product });
  const removeFromCart = (productId: number) => dispatch({ type: "remove", productId });
  const setQuantity = (product: Product, quantity: number) =>
    dispatch({ type: "set", product, quantity });
  const clearCart = () => dispatch({ type: "clear" });

  const totalPrice = useMemo(
    () => state.items.reduce((sum, item) => sum + item.product.price * item.quantity, 0),
    [state.items],
  );

  return (
    <CartContext.Provider
      value={{ state, addToCart, removeFromCart, setQuantity, clearCart, totalPrice }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within CartProvider");
  }
  return context;
};
