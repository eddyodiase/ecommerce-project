import axios from "axios";
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { getGuestCartTotalQuantity } from "../../utils/cart";
import "./CheckoutHeader.css";

export function CheckoutHeader({ cartRefreshKey = 0, user, onLogout }) {
  const navigate = useNavigate();
  const [totalItems, setTotalItems] = useState(0);
  const authToken = localStorage.getItem("authToken");

  const guestTotalItems = getGuestCartTotalQuantity();

  useEffect(() => {
    if (!authToken) {
      return;
    }

    axios
      .get("/api/payment-summary", {
        headers: { Authorization: `Bearer ${authToken}` },
      })
      .then((response) => {
        setTotalItems(response.data?.totalItems || 0);
      })
      .catch((error) => {
        console.error("Error loading checkout summary:", error);
      });
  }, [authToken, cartRefreshKey]);

  const displayTotalItems = authToken ? totalItems : guestTotalItems;

  return (
    <div className="checkout-header">
      <div className="header-content">
        <div className="checkout-header-left-section">
          <Link to="/">
            <img className="logo" src="/images/logo-white.png" alt="logo" />
            <img className="mobile-logo" src="/images/mobile-logo.png" alt="mobile logo" />
          </Link>
        </div>
        <div className="checkout-header-middle-section">
          Checkout (
          <button type="button" className="return-to-home-link" onClick={() => navigate("/")}>
            {displayTotalItems} items
          </button>
          )
        </div>
        <div className="checkout-header-right-section" style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          {user ? (
            <button
              type="button"
              className="return-to-home-link"
              onClick={() => {
                onLogout?.();
                navigate("/");
              }}
            >
              Logout
            </button>
          ) : null}
          <img src="/images/icons/checkout-lock-icon.png" alt="secure checkout" />
        </div>
      </div>
    </div>
  );
}
