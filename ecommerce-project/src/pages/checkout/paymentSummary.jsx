
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { toCurrency } from "../../utils/money";

export function PaymentSummary({ paymentSummary = {} }) {
  const navigate = useNavigate();

  const handlePlaceOrder = async () => {
    try {
      await axios.post("/api/orders");
      navigate("/orders");
    } catch (error) {
      console.error("Error placing order:", error);
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
      <button className="place-order-button button-primary" type="button" onClick={handlePlaceOrder}>
        Place your order
      </button>
    </div>
  );
}