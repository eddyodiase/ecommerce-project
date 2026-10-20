import axios from "axios";
import dayjs from "dayjs";
import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Header } from "../components/Header";
import "./TrackingPage.css";

export function TrackingPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [trackingItem, setTrackingItem] = useState(null);

  useEffect(() => {
    const hydrateTrackingInfo = async () => {
      if (location.state) {
        setTrackingItem(location.state);
        return;
      }

      try {
        const response = await axios.get("/api/orders?expand=products");
        const latestOrder = response.data?.[0];
        const latestProduct = latestOrder?.products?.[0];

        if (latestOrder && latestProduct) {
          setTrackingItem({
            orderId: latestOrder.id,
            product: latestProduct.product,
            quantity: latestProduct.quantity,
            estimatedDeliveryTimeMs: latestProduct.estimatedDeliveryTimeMs,
          });
        }
      } catch (error) {
        console.error("Error loading tracking info:", error);
      }
    };

    hydrateTrackingInfo();
  }, [location.state]);

  const product = trackingItem?.product;
  const quantity = trackingItem?.quantity || 1;
  const estimatedDeliveryTimeMs = trackingItem?.estimatedDeliveryTimeMs;

  return (
    <>
      <Header />

      <div className="tracking-page">
        <div className="order-tracking">
          <button type="button" className="back-to-orders-link link-primary" onClick={() => navigate("/orders")}>
            View all orders
          </button>

          <div className="delivery-date">
            {estimatedDeliveryTimeMs
              ? `Arriving on ${dayjs(estimatedDeliveryTimeMs).format("dddd, MMMM D")}`
              : "Delivery date pending"}
          </div>

          <div className="product-info">{product?.name || "Product"}</div>

          <div className="product-info">Quantity: {quantity}</div>

          {product?.image ? (
            <img className="product-image" src={product.image} alt={product.name} />
          ) : null}

          <div className="progress-labels-container">
            <div className="progress-label">Preparing</div>
            <div className="progress-label current-status">Shipped</div>
            <div className="progress-label">Delivered</div>
          </div>

          <div className="progress-bar-container">
            <div className="progress-bar"></div>
          </div>
        </div>
      </div>
    </>
  );
}