
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

  const loadCheckoutData = async () => {
    try {
      const [cartResponse, deliveryOptionsResponse, paymentSummaryResponse] = await Promise.all([
        axios.get("/api/cart-items?expand=product"),
        axios.get("/api/delivery-options?expand=estimatedDeliveryTime"),
        axios.get("/api/payment-summary"),
      ]);

      setCartItems(cartResponse.data || []);
      setDeliveryOptions(deliveryOptionsResponse.data || []);
      setSummary(paymentSummaryResponse.data || {});
    } catch (error) {
      console.error("Error loading checkout data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;

    const fetchCheckoutData = async () => {
      try {
        const [cartResponse, deliveryOptionsResponse, paymentSummaryResponse] = await Promise.all([
          axios.get("/api/cart-items?expand=product"),
          axios.get("/api/delivery-options?expand=estimatedDeliveryTime"),
          axios.get("/api/payment-summary"),
        ]);

        if (!isMounted) {
          return;
        }

        setCartItems(cartResponse.data || []);
        setDeliveryOptions(deliveryOptionsResponse.data || []);
        setSummary(paymentSummaryResponse.data || {});
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

  const onQuantityChange = async (productId, quantity) => {
    try {
      await axios.put(`/api/cart-items/${productId}`, { quantity });
      await loadCheckoutData();
      onCartChange?.();
    } catch (error) {
      console.error("Error updating cart quantity:", error);
    }
  };

  const onRemoveItem = async (productId) => {
    try {
      await axios.delete(`/api/cart-items/${productId}`);
      await loadCheckoutData();
      onCartChange?.();
    } catch (error) {
      console.error("Error removing cart item:", error);
    }
  };

  const onDeliveryOptionChange = async (productId, deliveryOptionId) => {
    try {
      await axios.put(`/api/cart-items/${productId}`, { deliveryOptionId });
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