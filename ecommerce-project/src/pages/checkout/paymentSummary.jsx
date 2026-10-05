
import { toCurrency } from "../../utils/money";

export function PaymentSummary({ summary = {} }) {
  return (
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
  );
}