import axios from "axios";
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./CheckoutHeader.css";

export function CheckoutHeader({ cartRefreshKey = 0, user, onLogout }) {
  const navigate = useNavigate();
  const [totalItems, setTotalItems] = useState(0);

  useEffect(() => {
    const authToken = localStorage.getItem("authToken");

    if (!authToken) {
      try {
        const guestCart = JSON.parse(localStorage.getItem("guestCart") || "{}");
        const nextTotalItems = Object.values(guestCart || {}).reduce(
          (sum, item) => sum + (Number(item.quantity) || 0),
          0
        );
        setTotalItems(nextTotalItems);
      } catch (error) {
        console.error("Error loading guest cart summary:", error);
        setTotalItems(0);
      }
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
  }, [cartRefreshKey]);

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
            {totalItems} items
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
