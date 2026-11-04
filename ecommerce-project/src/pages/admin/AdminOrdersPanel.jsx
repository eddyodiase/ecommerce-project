import axios from "axios";
import { useCallback, useEffect, useState } from "react";
import { toCurrency } from "../../utils/money";

const KEY_STORAGE = "adminApiKey";

// Order payment operations: confirm transfers / cash, cancel unpaid orders, refund paid ones.
export function AdminOrdersPanel() {
  const [adminKey, setAdminKey] = useState(() => sessionStorage.getItem(KEY_STORAGE) || "");
  const [orders, setOrders] = useState([]);
  const [message, setMessage] = useState("");

  const load = useCallback(async () => {
    try {
      const response = await axios.get("/api/orders");
      setOrders((response.data || []).filter((order) => order.paymentMethod && order.paymentMethod !== "legacy"));
    } catch {
      setMessage("We could not load orders.");
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const saveKey = (value) => {
    setAdminKey(value);
    sessionStorage.setItem(KEY_STORAGE, value);
  };

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
      <label>
        Admin key{" "}
        <input type="password" value={adminKey} onChange={(event) => saveKey(event.target.value)} />
      </label>
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
