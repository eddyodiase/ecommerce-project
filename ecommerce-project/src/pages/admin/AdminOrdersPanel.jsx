import axios from "axios";
import { useCallback, useEffect, useState } from "react";
import { toCurrency } from "../../utils/money";

// Order payment operations: confirm transfers / cash, cancel unpaid orders, refund paid ones.
export function AdminOrdersPanel({ adminKey }) {
  const [orders, setOrders] = useState([]);
  const [message, setMessage] = useState("");

  const load = useCallback(async () => {
    if (!adminKey) {
      setOrders([]);
      setMessage("");
      return;
    }
    try {
      const response = await axios.get("/api/orders", { headers: { "x-admin-key": adminKey } });
      setOrders((response.data || []).filter((order) => order.paymentMethod && order.paymentMethod !== "legacy"));
    } catch {
      setMessage("We could not load orders.");
    }
  }, [adminKey]);

  useEffect(() => {
    Promise.resolve().then(load);
  }, [load]);

  const act = async (order, action, body = {}) => {
    try {
      setMessage("");
      await axios.post(`/api/orders/${order.id}/${action}`, body, { headers: { "x-admin-key": adminKey } });
      await load();
    } catch (error) {
      setMessage(error?.response?.data?.error || "That action failed.");
    }
  };

  const refund = (order) => {
    const reason = window.prompt("Reason for refund?");
    if (reason === null) return;
    const amount = window.prompt("Amount to refund in naira (leave empty for the full remaining amount)", "");
    if (amount === null) return;
    const restock = window.confirm("Return the items to stock?");
    const body = { reason, restock };
    if (amount.trim()) body.amountCents = Math.round(Number(amount) * 100);
    void act(order, "refund", body);
  };

  return (
    <section className="admin-orders-panel">
      <h2>Order payments</h2>
      {message ? <div className="admin-error">{message}</div> : null}
      {orders.length === 0 ? <div className="admin-empty">No orders with payments yet.</div> : null}
      {orders.map((order) => {
        const unpaid = order.status === "placed" && order.paymentStatus === "pending";
        const refundable = ["paid", "partially_refunded"].includes(order.paymentStatus) && order.refundedCents < order.totalCostCents;
        return (
          <article key={order.id} className="listing-card">
            <p>
              <strong>{order.id}</strong> · {toCurrency(order.totalCostCents)} · {order.paymentMethod} ·{" "}
              {order.status === "cancelled" ? "cancelled" : order.paymentStatus}
              {order.refundedCents > 0 ? ` · refunded ${toCurrency(order.refundedCents)}` : ""}
            </p>
            <p className="listing-meta">{order.shippingAddress?.fullName} · {order.shippingAddress?.phone}</p>
            <div className="listing-actions">
              {unpaid && order.paymentMethod !== "paystack" && (
                <button type="button" className="approve-button" onClick={() => act(order, "confirm-payment")}>
                  Confirm payment received
                </button>
              )}
              {unpaid && (
                <button type="button" className="reject-button" onClick={() => act(order, "cancel")}>Cancel order</button>
              )}
              {refundable && (
                <button type="button" className="reject-button" onClick={() => refund(order)}>Refund</button>
              )}
            </div>
          </article>
        );
      })}
    </section>
  );
}
