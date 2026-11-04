
import axios from "axios";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toCurrency } from "../../utils/money";
import { saveShippingAddress, validateShippingAddress } from "../../utils/shippingAddress";

export function PaymentSummary({ paymentSummary = {}, shippingAddress = {}, onAddressInvalid }) {
  const navigate = useNavigate();
  const [orderError, setOrderError] = useState("");

  const handlePlaceOrder = async () => {
    const errors = validateShippingAddress(shippingAddress);
    onAddressInvalid?.(errors);
    if (Object.keys(errors).length > 0) {
      setOrderError("Please complete your shipping address.");
      return;
    }

    try {
      setOrderError("");
      await axios.post("/api/orders", { shippingAddress });
      saveShippingAddress(shippingAddress);
      navigate("/orders");
    } catch (error) {
      console.error("Error placing order:", error);
      setOrderError(error?.response?.data?.error || "We could not place your order. Please try again.");
    }
  };

  return (
    <div className="payment-summary">
      <div className="payment-summary-title">Payment Summary</div>
      <div className="payment-summary-row">
        <div>Items ({paymentSummary.totalItems || 0}):</div>
        <div className="payment-summary-money">{toCurrency(paymentSummary.productCostCents || 0)}</div>
      </div>
      <div className="payment-summary-row">
        <div>Shipping &amp; handling:</div>
        <div className="payment-summary-money">{toCurrency(paymentSummary.shippingCostCents || 0)}</div>
      </div>
      <div className="payment-summary-row subtotal-row">
        <div>Total before tax:</div>
        <div className="payment-summary-money">{toCurrency(paymentSummary.totalCostBeforeTaxCents || 0)}</div>
      </div>
      <div className="payment-summary-row">
        <div>Estimated tax (10%):</div>
        <div className="payment-summary-money">{toCurrency(paymentSummary.taxCents || 0)}</div>
      </div>
      <div className="payment-summary-row total-row">
        <div>Order total:</div>
        <div className="payment-summary-money">{toCurrency(paymentSummary.totalCostCents || 0)}</div>
      </div>
      {orderError && <div className="shipping-address-error" role="alert">{orderError}</div>}
      <button className="place-order-button button-primary" type="button" onClick={handlePlaceOrder}>
        Place your order
      </button>
    </div>
  );
}