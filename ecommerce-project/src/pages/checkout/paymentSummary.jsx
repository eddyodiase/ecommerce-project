
import axios from "axios";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toCurrency } from "../../utils/money";
import { saveShippingAddress, validateShippingAddress } from "../../utils/shippingAddress";

const METHOD_LABELS = {
  paystack: "Pay online (card, bank, USSD via Paystack)",
  bank_transfer: "Bank transfer",
  pay_on_delivery: "Pay on delivery",
};

export function PaymentSummary({ paymentSummary = {}, shippingAddress = {}, onAddressInvalid }) {
  const navigate = useNavigate();
  const [orderError, setOrderError] = useState("");
  const [methods, setMethods] = useState({ pay_on_delivery: { enabled: true } });
  const [paymentMethod, setPaymentMethod] = useState("");
  const [placing, setPlacing] = useState(false);
  // One key per checkout attempt, so a double click or retry cannot create two orders.
  const idempotencyKey = useRef(`order-${Date.now()}-${Math.random().toString(36).slice(2)}`);

  useEffect(() => {
    let active = true;
    Promise.resolve()
      .then(() => axios.get("/api/payments/methods"))
      .then((response) => {
        if (active && response?.data) setMethods(response.data);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  const enabledMethods = Object.keys(METHOD_LABELS).filter((key) => methods[key]?.enabled);
  const selectedMethod = enabledMethods.includes(paymentMethod) ? paymentMethod : enabledMethods[0] || "";

  const handlePlaceOrder = async () => {
    if (placing) return;
    if (!selectedMethod) {
      setOrderError("No payment method is available right now.");
      return;
    }
    const errors = validateShippingAddress(shippingAddress);
    onAddressInvalid?.(errors);
    if (Object.keys(errors).length > 0) {
      setOrderError("Please complete your shipping address.");
      return;
    }

    try {
      setOrderError("");
      setPlacing(true);
      const response = await axios.post(
        "/api/orders",
        { shippingAddress, paymentMethod: selectedMethod },
        { headers: { "Idempotency-Key": idempotencyKey.current } },
      );
      saveShippingAddress(shippingAddress);
      const authorizationUrl = response?.data?.authorizationUrl;
      if (selectedMethod === "paystack" && authorizationUrl) {
        window.location.assign(authorizationUrl);
        return;
      }
      navigate("/orders");
    } catch (error) {
      console.error("Error placing order:", error);
      setOrderError(error?.response?.data?.error || "We could not place your order. Please try again.");
      setPlacing(false);
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
      <fieldset className="payment-method-picker">
        <legend>Payment method</legend>
        {enabledMethods.map((key) => (
          <label key={key} className="payment-method-option">
            <input
              type="radio"
              name="paymentMethod"
              value={key}
              checked={selectedMethod === key}
              onChange={() => setPaymentMethod(key)}
            />
            {METHOD_LABELS[key]}
          </label>
        ))}
        {selectedMethod === "bank_transfer" && methods.bank_transfer?.account?.accountNumber && (
          <div className="payment-method-note">
            Transfer to {methods.bank_transfer.account.bankName} {methods.bank_transfer.account.accountNumber} (
            {methods.bank_transfer.account.accountName}) after placing your order, using the order ID as the reference.
          </div>
        )}
        {selectedMethod === "pay_on_delivery" && (
          <div className="payment-method-note">Pay in cash or by transfer when your order arrives.</div>
        )}
      </fieldset>
      {orderError && <div className="shipping-address-error" role="alert">{orderError}</div>}
      <button className="place-order-button button-primary" type="button" onClick={handlePlaceOrder} disabled={placing}>
        {selectedMethod === "paystack" ? "Pay & place order" : "Place your order"}
      </button>
    </div>
  );
}