import axios from "axios";
import { useEffect, useState } from "react";
import { OrderSummary } from "./orderSummary";
import { PaymentSummary } from "./paymentSummary";
import "./CheckoutHeader.css";
import "./CheckoutPage.css";

export function CheckoutPage({ onCartChange }) {
  const [cartItems, setCartItems] = useState([]);
  const [deliveryOptions, setDeliveryOptions] = useState([]);
  const [summary, setSummary] = useState({
    totalItems: 0,
    productCostCents: 0,
    shippingCostCents: 0,
    totalCostBeforeTaxCents: 0,
    taxCents: 0,
    totalCostCents: 0,
  });
  const [loading, setLoading] = useState(true);

  const calculateSummary = (items, options) => {
    const totalItems = items.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);
    const productCostCents = items.reduce(
      (sum, item) => sum + (Number(item.product?.priceCents) || 0) * (Number(item.quantity) || 0),
      0
    );
    const shippingCostCents = items.reduce((sum, item) => {
      const selectedOption = options.find((option) => option.id === item.deliveryOptionId) || options[0];
      return sum + (Number(selectedOption?.priceCents) || 0);
    }, 0);

    const totalCostBeforeTaxCents = productCostCents + shippingCostCents;
    const taxCents = Math.round(totalCostBeforeTaxCents * 0.1);

    return {
      totalItems,
      productCostCents,
      shippingCostCents,
      totalCostBeforeTaxCents,
      taxCents,
      totalCostCents: totalCostBeforeTaxCents + taxCents,
    };
  };

  const getGuestCartItems = () => {
    const guestCart = JSON.parse(localStorage.getItem("guestCart") || "{}");
    return Object.values(guestCart || {}).map((item) => ({
      ...item,
      productId: item.productId || item.product?.id,
      quantity: Number(item.quantity) || 1,
      deliveryOptionId: item.deliveryOptionId || "1",
      product: item.product || null,
    }));
  };

  const loadCheckoutData = async () => {
    const token = localStorage.getItem("authToken");

    try {
      const [deliveryOptionsResponse, paymentSummaryResponse] = await Promise.all([
        axios.get("/api/delivery-options?expand=estimatedDeliveryTime"),
        axios.get("/api/payment-summary"),
      ]);

      const nextDeliveryOptions = deliveryOptionsResponse.data || [];
      let nextCartItems = [];

      if (!token) {
        nextCartItems = getGuestCartItems();
      } else {
        const cartResponse = await axios.get("/api/cart-items?expand=product", {
          headers: { Authorization: `Bearer ${token}` },
        });
        nextCartItems = cartResponse.data || [];
      }

      setCartItems(nextCartItems);
      setDeliveryOptions(nextDeliveryOptions);

      const nextSummary = calculateSummary(nextCartItems, nextDeliveryOptions);
      setSummary({
        ...nextSummary,
        ...(paymentSummaryResponse?.data || {}),
      });
    } catch (error) {
      console.error("Error loading checkout data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;

    const fetchCheckoutData = async () => {
      const token = localStorage.getItem("authToken");

      try {
        const [deliveryOptionsResponse, paymentSummaryResponse] = await Promise.all([
          axios.get("/api/delivery-options?expand=estimatedDeliveryTime"),
          axios.get("/api/payment-summary"),
        ]);

        if (!isMounted) {
          return;
        }

        const nextDeliveryOptions = deliveryOptionsResponse.data || [];
        const nextCartItems = token
          ? (await axios.get("/api/cart-items?expand=product", {
              headers: { Authorization: `Bearer ${token}` },
            })).data || []
          : getGuestCartItems();

        setCartItems(nextCartItems);
        setDeliveryOptions(nextDeliveryOptions);
        setSummary({
          ...calculateSummary(nextCartItems, nextDeliveryOptions),
          ...(paymentSummaryResponse?.data || {}),
        });
      } catch (error) {
        console.error("Error loading checkout data:", error);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchCheckoutData();

    return () => {
      isMounted = false;
    };
  }, []);

  const updateGuestCart = (updater) => {
    const guestCart = JSON.parse(localStorage.getItem("guestCart") || "{}");
    const nextCart = updater(guestCart);
    localStorage.setItem("guestCart", JSON.stringify(nextCart));
    const nextCartItems = getGuestCartItems();
    setCartItems(nextCartItems);
    setSummary(calculateSummary(nextCartItems, deliveryOptions));
  };

  const onQuantityChange = async (productId, quantity) => {
    const token = localStorage.getItem("authToken");

    if (!token) {
      updateGuestCart((guestCart) => {
        if (!guestCart[productId]) {
          return guestCart;
        }

        return {
          ...guestCart,
          [productId]: {
            ...guestCart[productId],
            quantity,
          },
        };
      });
      onCartChange?.();
      return;
    }

    try {
      await axios.put(`/api/cart-items/${productId}`, { quantity }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      await loadCheckoutData();
      onCartChange?.();
    } catch (error) {
      console.error("Error updating cart quantity:", error);
    }
  };

  const onRemoveItem = async (productId) => {
    const token = localStorage.getItem("authToken");

    if (!token) {
      updateGuestCart((guestCart) => {
        const nextCart = { ...guestCart };
        delete nextCart[productId];
        return nextCart;
      });
      onCartChange?.();
      return;
    }

    try {
      await axios.delete(`/api/cart-items/${productId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      await loadCheckoutData();
      onCartChange?.();
    } catch (error) {
      console.error("Error removing cart item:", error);
    }
  };

  const onDeliveryOptionChange = async (productId, deliveryOptionId) => {
    const token = localStorage.getItem("authToken");

    if (!token) {
      updateGuestCart((guestCart) => {
        if (!guestCart[productId]) {
          return guestCart;
        }

        return {
          ...guestCart,
          [productId]: {
            ...guestCart[productId],
            deliveryOptionId,
          },
        };
      });
      onCartChange?.();
      return;
    }

    try {
      await axios.put(`/api/cart-items/${productId}`, { deliveryOptionId }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      await loadCheckoutData();
      onCartChange?.();
    } catch (error) {
      console.error("Error updating delivery option:", error);
    }
  };

  return (
    <div className="checkout-page">
      <div className="page-title">Review your order</div>

      {loading ? (
        <div className="checkout-loading">Loading your cart...</div>
      ) : cartItems.length === 0 ? (
        <div className="empty-cart">Your cart is empty.</div>
      ) : (
        <div className="checkout-grid">
          <OrderSummary
            cartItems={cartItems}
            deliveryOptions={deliveryOptions}
            onQuantityChange={onQuantityChange}
            onRemoveItem={onRemoveItem}
            onDeliveryOptionChange={onDeliveryOptionChange}
          />

          <PaymentSummary paymentSummary={summary} />
        </div>
      )}
    </div>
  );
}
