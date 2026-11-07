import axios from "axios";
import { useCallback, useEffect, useMemo, useState } from "react";
import { CartContext } from "./cartContextValue";

export function CartProvider({ children }) {
  const [cartCount, setCartCount] = useState(0);

  const refreshCartCount = useCallback(async () => {
    const response = await axios.get("/api/cart-items");
    const items = Array.isArray(response.data) ? response.data : [];
    const nextCount = items.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);
    setCartCount(nextCount);
  }, []);

  const addToCart = useCallback(async (productId, amount = 1, size = "") => {
    await axios.post("/api/cart-items", {
      productId,
      quantity: amount,
      ...(size ? { size } : {}),
    });
    await refreshCartCount();
  }, [refreshCartCount]);

  useEffect(() => {
    Promise.resolve()
      .then(refreshCartCount)
      .catch((error) => {
        console.error("Error loading cart count:", error);
        setCartCount(0);
      });
  }, [refreshCartCount]);

  const value = useMemo(
    () => ({
      cartCount,
      refreshCartCount,
      addToCart,
    }),
    [cartCount, refreshCartCount, addToCart]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}
