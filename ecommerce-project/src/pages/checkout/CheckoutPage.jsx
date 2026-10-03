
import axios from "axios";
import { formatMoney } from "../../utils/money";
import { useEffect, useState } from "react";
import { OrderSummary } from "./orderSummary";
import "./CheckoutHeader.css";
import "./CheckoutPage.css";

const toCurrency = (cents) => formatMoney(cents);

export function CheckoutPage() {
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

  const handleQuantityUpdate = async (productId, quantity) => {
    try {
      await axios.put(`/api/cart-items/${productId}`, { quantity });
      await loadCheckoutData();
    } catch (error) {
      console.error("Error updating cart quantity:", error);
    }
  };

  const handleDelete = async (productId) => {
    try {
      await axios.delete(`/api/cart-items/${productId}`);
      await loadCheckoutData();
    } catch (error) {
      console.error("Error removing cart item:", error);
    }
  };

  const handleDeliveryOptionChange = async (productId, deliveryOptionId) => {
    try {
      await axios.put(`/api/cart-items/${productId}`, { deliveryOptionId });
      await loadCheckoutData();
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
            handleQuantityUpdate={handleQuantityUpdate}
            handleDelete={handleDelete}
            handleDeliveryOptionChange={handleDeliveryOptionChange}
          />

          <div className="payment-summary">
            <div className="payment-summary-title">Payment Summary</div>
            <div className="payment-summary-row">
              <div>Items ({summary.totalItems || 0}):</div>
              <div className="payment-summary-money">{toCurrency(summary.productCostCents || 0)}</div>
            </div>
            <div className="payment-summary-row">
              <div>Shipping &amp; handling:</div>
              <div className="payment-summary-money">{toCurrency(summary.shippingCostCents || 0)}</div>
            </div>
            <div className="payment-summary-row subtotal-row">
              <div>Total before tax:</div>
              <div className="payment-summary-money">{toCurrency(summary.totalCostBeforeTaxCents || 0)}</div>
            </div>
            <div className="payment-summary-row">
              <div>Estimated tax (10%):</div>
              <div className="payment-summary-money">{toCurrency(summary.taxCents || 0)}</div>
            </div>
            <div className="payment-summary-row total-row">
              <div>Order total:</div>
              <div className="payment-summary-money">{toCurrency(summary.totalCostCents || 0)}</div>
            </div>
            <button className="place-order-button button-primary" type="button">
              Place your order
            </button>
          </div>
        </div>
      )}
    </div>
  );
}