import axios from "axios";
import dayjs from "dayjs";
import { Fragment, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "../../components/Header";
import { toCurrency } from "../../utils/money";
import "./OrdersPage.css";

function OrderRow({ order, product, quantity, size, estimatedDeliveryTimeMs, onCartRefresh }) {
  const navigate = useNavigate();

  const handleAddToCart = async () => {
    try {
      await axios.post("/api/cart-items", {
        productId: product.id,
        quantity,
        ...(size ? { size } : {}),
      });
      onCartRefresh?.();
    } catch (error) {
      console.error("Error adding previous order item to cart:", error);
    }
  };

  return (
    <Fragment key={`${product.id}-${quantity}`}>
      <div className="product-image-container">
        <img src={product.image} alt={product.name} />
      </div>

      <div className="product-details">
        <div className="product-name">{product.name}</div>
        <div className="product-delivery-date">
          {estimatedDeliveryTimeMs
            ? `Arriving on: ${dayjs(estimatedDeliveryTimeMs).format("MMM D")}`
            : "Delivery date pending"}
        </div>
        <div className="product-quantity">Quantity: {quantity}</div>
        {size ? <div className="product-quantity">Size: {size}</div> : null}
        <button type="button" className="buy-again-button button-primary" onClick={handleAddToCart}>
          <img className="buy-again-icon" src="/images/icons/buy-again.png" alt="buy again" />
          <span className="buy-again-message">Add to Cart</span>
        </button>
      </div>

      <div className="product-actions">
        <button
          type="button"
          className="track-package-button button-secondary"
          onClick={() =>
            navigate("/tracking", {
              state: {
                orderId: order.id,
                product,
                quantity,
                estimatedDeliveryTimeMs,
              },
            })
          }
        >
          Track package
        </button>
      </div>
    </Fragment>
  );
}

const PAYMENT_STATUS_LABELS = {
  pending: "Awaiting payment",
  paid: "Paid",
  failed: "Payment failed",
  partially_refunded: "Partially refunded",
  refunded: "Refunded",
};
const METHOD_NAMES = { paystack: "Card / Paystack", bank_transfer: "Bank transfer", pay_on_delivery: "Pay on delivery" };

function PaymentInfo({ order }) {
  const [bank, setBank] = useState(null);
  const [error, setError] = useState("");
  const awaitingPayment = order.status === "placed" && order.paymentStatus === "pending";

  useEffect(() => {
    if (!(awaitingPayment && order.paymentMethod === "bank_transfer")) return;
    Promise.resolve()
      .then(() => axios.get("/api/payments/methods"))
      .then((response) => setBank(response?.data?.bank_transfer?.account || null))
      .catch(() => {});
  }, [awaitingPayment, order.paymentMethod]);

  if (!order.paymentMethod || order.paymentMethod === "legacy") return null;

  const payNow = async () => {
    try {
      setError("");
      const response = await axios.post(`/api/orders/${order.id}/pay`);
      window.location.assign(response.data.authorizationUrl);
    } catch (err) {
      setError(err?.response?.data?.paymentError || err?.response?.data?.error || "Could not start payment.");
    }
  };

  const statusText = order.status === "cancelled" ? "Cancelled" : PAYMENT_STATUS_LABELS[order.paymentStatus] || order.paymentStatus;

  return (
    <div className="order-payment-info">
      <div>
        Payment: {METHOD_NAMES[order.paymentMethod] || order.paymentMethod} · <strong>{statusText}</strong>
        {order.refundedCents > 0 ? ` · Refunded ${toCurrency(order.refundedCents)}` : ""}
      </div>
      {awaitingPayment && order.paymentMethod === "paystack" && (
        <button type="button" className="button-primary" onClick={payNow}>Pay now</button>
      )}
      {awaitingPayment && order.paymentMethod === "bank_transfer" && (
        <div>
          Transfer {toCurrency(order.totalCostCents || 0)}
          {bank?.accountNumber ? ` to ${bank.bankName} ${bank.accountNumber} (${bank.accountName})` : ""} using reference{" "}
          <strong>{order.id}</strong>. We confirm your order once the transfer is received.
        </div>
      )}
      {error && <div className="shipping-address-error" role="alert">{error}</div>}
    </div>
  );
}

function OrderCard({ order, onCartRefresh }) {
  return (
    <div className="order-container">
      <div className="order-header">
        <div className="order-header-left-section">
          <div className="order-date">
            <div className="order-header-label">Order Placed:</div>
            <div>{dayjs(order.orderTimeMs).format("MMM D")}</div>
          </div>
          <div className="order-total">
            <div className="order-header-label">Total:</div>
            <div>{toCurrency(order.totalCostCents || 0)}</div>
          </div>
        </div>

        <div className="order-header-right-section">
          <div className="order-header-label">Order ID:</div>
          <div>{order.id}</div>
        </div>
      </div>

      {order.shippingAddress && (
        <div className="order-shipping-address">
          Ship to: {order.shippingAddress.fullName}, {order.shippingAddress.addressLine1}
          {order.shippingAddress.addressLine2 ? `, ${order.shippingAddress.addressLine2}` : ""}, {order.shippingAddress.city}, {order.shippingAddress.state} · {order.shippingAddress.phone}
        </div>
      )}

      <PaymentInfo order={order} />

      <div className="order-details-grid">
        {order.products?.map((productEntry) => {
          const product = productEntry.product || {};
          const productKey = `${order.id}-${productEntry.productId}`;

          return (
            <OrderRow
              key={productKey}
              order={order}
              product={product}
              quantity={productEntry.quantity}
              size={productEntry.size}
              estimatedDeliveryTimeMs={productEntry.estimatedDeliveryTimeMs}
              onCartRefresh={onCartRefresh}
            />
          );
        })}
      </div>
    </div>
  );
}

export function OrdersPage({ quantityByProduct, onCartRefresh, user, onLogout }) {
  const [orders, setOrders] = useState([]);

  const fetchOrders = async () => {
    try {
      const response = await axios.get("/api/orders?expand=products");
      setOrders(response.data || []);
    } catch (error) {
      console.error("Error fetching orders:", error);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  return (
    <>
      <Header quantityByProduct={quantityByProduct} user={user} onLogout={onLogout} />

      <div className="orders-page">
        <div className="page-title">Your Orders</div>

        {orders.length === 0 ? (
          <div className="empty-cart">No orders yet.</div>
        ) : (
          <div className="orders-grid">
            {orders.map((order) => (
              <OrderCard key={order.id} order={order} onCartRefresh={onCartRefresh} />
            ))}
          </div>
        )}
      </div>
    </>
  );
}