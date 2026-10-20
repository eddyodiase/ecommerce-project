import axios from "axios";
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./CheckoutHeader.css";

export function CheckoutHeader({ cartRefreshKey = 0 }) {
  const navigate = useNavigate();
  const [totalItems, setTotalItems] = useState(0);

  useEffect(() => {
    axios
      .get("/api/payment-summary")
      .then((response) => {
        setTotalItems(response.data?.totalItems || 0);
      })
      .catch((error) => {
        console.error("Error loading checkout summary:", error);
      });
  }, [cartRefreshKey]);

  return (
    <div className="checkout-header">
      <div className="header-content">
        <div className="checkout-header-left-section">
          <Link to="/">
            <img className="logo" src="/images/logo.png" alt="logo" />
            <img className="mobile-logo" src="/images/mobile-logo.png" alt="mobile logo" />
          </Link>
        </div>
        <div className="checkout-header-middle-section">
          Checkout (
          <button type="button" className="return-to-home-link" onClick={() => navigate("/")}>
            {totalItems} items
          </button>
          )
        </div>
        <div className="checkout-header-right-section">
          <img src="/images/icons/checkout-lock-icon.png" alt="secure checkout" />
        </div>
      </div>
    </div>
  );
}
