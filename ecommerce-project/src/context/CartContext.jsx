import axios from "axios";
import { createContext, useContext, useEffect, useMemo, useState } from "react";

const defaultCartContext = {
  cartCount: 0,
  refreshCartCount: async () => {},
  addToCart: async () => {},
};

const CartContext = createContext(defaultCartContext);

export function CartProvider({ children }) {
  const [cartCount, setCartCount] = useState(0);

  const refreshCartCount = async () => {
    const response = await axios.get("/api/cart-items");
    const items = Array.isArray(response.data) ? response.data : [];
    const nextCount = items.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);
    setCartCount(nextCount);
  };

  const addToCart = async (productId, amount = 1) => {
    await axios.post("/api/cart-items", {
      productId,
      quantity: amount,
    });
    await refreshCartCount();
  };

  useEffect(() => {
    refreshCartCount().catch((error) => {
      console.error("Error loading cart count:", error);
      setCartCount(0);
    });
  }, []);

  const value = useMemo(
    () => ({
      cartCount,
      refreshCartCount,
      addToCart,
    }),
    [cartCount]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  return useContext(CartContext);
}
