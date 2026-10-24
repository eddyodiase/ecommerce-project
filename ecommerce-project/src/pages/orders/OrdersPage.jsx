import axios from "axios";
import dayjs from "dayjs";
import { Fragment, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "../../components/Header";
import { formatMoney } from "../../utils/money";
import "./OrdersPage.css";

function OrderRow({ order, product, quantity, estimatedDeliveryTimeMs, onCartRefresh }) {
  const navigate = useNavigate();

  const handleAddToCart = async () => {
    try {
      await axios.post("/api/cart-items", {
        productId: product.id,
        quantity,
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
            <div>{formatMoney(order.totalCostCents || 0)}</div>
          </div>
        </div>

        <div className="order-header-right-section">
          <div className="order-header-label">Order ID:</div>
          <div>{order.id}</div>
        </div>
      </div>

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
    const token = localStorage.getItem("authToken");

    try {
      const response = await axios.get("/api/orders?expand=products", {
        headers: { Authorization: `Bearer ${token}` },
      });
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