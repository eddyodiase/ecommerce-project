import { createContext } from "react";

export const CartContext = createContext({
  cartCount: 0,
  refreshCartCount: async () => {},
  addToCart: async () => {},
});
