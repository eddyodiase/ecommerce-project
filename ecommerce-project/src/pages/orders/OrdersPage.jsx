import axios from "axios";
import dayjs from "dayjs";
import { Fragment, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Header } from "../../components/Header";
import { formatMoney } from "../../utils/money";
import "./OrdersPage.css";

function OrderRow({ product, quantity, estimatedDeliveryTimeMs }) {
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
        <button type="button" className="buy-again-button button-primary">
          <img className="buy-again-icon" src="/images/icons/buy-again.png" alt="buy again" />
          <span className="buy-again-message">Add to Cart</span>
        </button>
      </div>

      <div className="product-actions">
        <Link className="track-package-button button-secondary" to="/tracking">
          Track package
        </Link>
      </div>
    </Fragment>
  );
}

function OrderCard({ order }) {
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
              product={product}
              quantity={productEntry.quantity}
              estimatedDeliveryTimeMs={productEntry.estimatedDeliveryTimeMs}
            />
          );
        })}
      </div>
    </div>
  );
}

export function OrdersPage({ quantityByProduct }) {
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const response = await axios.get("/api/orders?expand=products");
        setOrders(response.data || []);
      } catch (error) {
        console.error("Error fetching orders:", error);
      }
    };

    fetchOrders();
  }, []);

  return (
    <>
      <Header quantityByProduct={quantityByProduct} />

      <div className="orders-page">
        <div className="page-title">Your Orders</div>

        {orders.length === 0 ? (
          <div className="empty-cart">No orders yet.</div>
        ) : (
          <div className="orders-grid">
            {orders.map((order) => (
              <OrderCard key={order.id} order={order} />
            ))}
          </div>
        )}
      </div>
    </>
  );
}