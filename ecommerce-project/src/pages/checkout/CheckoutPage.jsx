
import axios from "axios";
import dayjs from "dayjs";
import { formatMoney } from "../../utils/money";
import { useEffect, useState } from "react";
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
    let active = true;

    const fetchCheckoutData = async () => {
      try {
        const [cartResponse, deliveryOptionsResponse, paymentSummaryResponse] = await Promise.all([
          axios.get("/api/cart-items?expand=product"),
          axios.get("/api/delivery-options?expand=estimatedDeliveryTime"),
          axios.get("/api/payment-summary"),
        ]);

        if (!active) {
          return;
        }

        setCartItems(cartResponse.data || []);
        setDeliveryOptions(deliveryOptionsResponse.data || []);
        setSummary(paymentSummaryResponse.data || {});
      } catch (error) {
        console.error("Error loading checkout data:", error);
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    fetchCheckoutData();

    return () => {
      active = false;
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
    <>
      <title>Checkout</title>
      <div className="checkout-page">
        <div className="page-title">Review your order</div>

        {loading ? (
          <div className="checkout-loading">Loading your cart...</div>
        ) : cartItems.length === 0 ? (
          <div className="empty-cart">Your cart is empty.</div>
        ) : (
          <div className="checkout-grid">
            <div className="order-summary">
              {cartItems.map((item) => {
                const product = item.product || {};
                const selectedDeliveryOption =
                  deliveryOptions.find((option) => option.id === item.deliveryOptionId) ||
                  deliveryOptions[0];

                return (
                  <div key={item.productId} className="cart-item-container">
                    <div className="delivery-date">
                      Delivery date: {selectedDeliveryOption
                        ? dayjs(selectedDeliveryOption.estimatedDeliveryTimeMs).format("MMM D")
                        : "As scheduled"}
                    </div>

                    <div className="cart-item-details-grid">
                      <img className="product-image" src={product.image} alt={product.name} />

                      <div className="cart-item-details">
                        <div className="product-name">{product.name}</div>
                        <div className="product-price">{toCurrency(product.priceCents || 0)}</div>
                        <div className="product-quantity">
                          <span>Quantity:</span>
                          <select
                            className="quantity-selector"
                            value={item.quantity || 1}
                            onChange={(event) =>
                              handleQuantityUpdate(item.productId, Number(event.target.value))
                            }
                          >
                            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((value) => (
                              <option key={value} value={value}>
                                {value}
                              </option>
                            ))}
                          </select>
                          <button
                            type="button"
                            className="delete-quantity-link"
                            onClick={() => handleDelete(item.productId)}
                          >
                            Delete
                          </button>
                        </div>
                      </div>

                      <div className="delivery-options">
                        <div className="delivery-options-title">Choose a delivery option:</div>
                        {deliveryOptions.map((option) => (
                          <label key={option.id} className="delivery-option">
                            <input
                              className="delivery-option-input"
                              type="radio"
                              name={`delivery-option-${item.productId}`}
                              checked={selectedDeliveryOption?.id === option.id}
                              onChange={() => handleDeliveryOptionChange(item.productId, option.id)}
                            />
                            <div>
                              <div className="delivery-option-date">
                                {dayjs(option.estimatedDeliveryTimeMs).format("MMM D")}
                              </div>
                              <div className="delivery-option-price">
                                {option.priceCents === 0
                                  ? "Free"
                                  : `${toCurrency(option.priceCents)} - Shipping`}
                              </div>
                            </div>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

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
    </>
  );
}