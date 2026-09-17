import axios from "axios";
import { useEffect, useState } from "react";
import "./CheckoutHeader.css";
import "./CheckoutPage.css";

const toCurrency = (cents) => `$${((cents || 0) / 100).toFixed(2)}`;

export function CheckoutPage() {
  const [cartItems, setCartItems] = useState([]);
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
      const [cartResponse, paymentSummaryResponse] = await Promise.all([
        axios.get("/api/cart-items?expand=product"),
        axios.get("/api/payment-summary"),
      ]);

      setCartItems(cartResponse.data || []);
      setSummary(paymentSummaryResponse.data || {});
    } catch (error) {
      console.error("Error loading checkout data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCheckoutData();
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

                return (
                  <div className="cart-item-container" key={item.productId}>
                    <div className="delivery-date">Delivery date: {item.deliveryOptionId ? "Arriving soon" : "As scheduled"}</div>
                    <div className="cart-item-details-grid">
                      <img className="product-image" src={product.image} alt={product.name} />

                      <div className="cart-item-details">
                        <div className="product-name">{product.name}</div>
                        <div className="product-price">{toCurrency(product.priceCents)}</div>
                        <div className="product-quantity">
                          <span>
                            Quantity:
                            <select
                              className="quantity-selector"
                              value={item.quantity}
                              onChange={(event) => handleQuantityUpdate(item.productId, Number(event.target.value))}
                            >
                              {[1,2,3,4,5,6,7,8,9,10].map((value) => (
                                <option key={value} value={value}>{value}</option>
                              ))}
                            </select>
                          </span>
                          <button
                            type="button"
                            className="delete-quantity-link link-primary"
                            onClick={() => handleDelete(item.productId)}
                          >
                            Delete
                          </button>
                        </div>
                      </div>

                      <div className="delivery-options">
                        <div className="delivery-options-title">Choose a delivery option:</div>
                        <div className="delivery-option">
                          <input type="radio" defaultChecked className="delivery-option-input" name={`delivery-option-${item.productId}`} />
                          <div>
                            <div className="delivery-option-date">Tuesday, June 21</div>
                            <div className="delivery-option-price">FREE Shipping</div>
                          </div>
                        </div>
                        <div className="delivery-option">
                          <input type="radio" className="delivery-option-input" name={`delivery-option-${item.productId}`} />
                          <div>
                            <div className="delivery-option-date">Wednesday, June 15</div>
                            <div className="delivery-option-price">$4.99 - Shipping</div>
                          </div>
                        </div>
                        <div className="delivery-option">
                          <input type="radio" className="delivery-option-input" name={`delivery-option-${item.productId}`} />
                          <div>
                            <div className="delivery-option-date">Monday, June 13</div>
                            <div className="delivery-option-price">$9.99 - Shipping</div>
                          </div>
                        </div>
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
