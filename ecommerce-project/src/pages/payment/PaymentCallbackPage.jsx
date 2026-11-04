import axios from "axios";
import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";

// Paystack sends the buyer back here. The result is confirmed with the server, never read from the URL.
export function PaymentCallbackPage() {
  const [params] = useSearchParams();
  const reference = params.get("reference") || params.get("trxref") || "";
  const [state, setState] = useState({ phase: reference ? "checking" : "error", message: reference ? "" : "Missing payment reference." });

  useEffect(() => {
    if (!reference) return;
    let active = true;
    axios
      .get("/api/payments/paystack/verify", { params: { reference } })
      .then((response) => {
        if (!active) return;
        setState(response.data.paymentStatus === "paid"
          ? { phase: "paid", message: "Payment received. Thank you!" }
          : { phase: "error", message: "Your payment was not completed. You can retry from your orders." });
      })
      .catch((error) => {
        if (!active) return;
        setState({ phase: "error", message: error?.response?.data?.error || "We could not confirm your payment yet." });
      });
    return () => {
      active = false;
    };
  }, [reference]);

  return (
    <div className="orders-page">
      <div className="page-title">Payment</div>
      <p role="status">{state.phase === "checking" ? "Confirming your payment…" : state.message}</p>
      <Link to="/orders">View your orders</Link>
    </div>
  );
}
