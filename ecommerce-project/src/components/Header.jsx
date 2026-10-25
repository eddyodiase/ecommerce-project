import axios from "axios";
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { getGuestCartItems, getGuestCartTotalQuantity } from "../utils/cart";
import "./Header.css";

export function Header({ cartRefreshKey = 0, user, onLogout }) {
  const navigate = useNavigate();
  const [cartItems, setCartItems] = useState([]);
  const authToken = localStorage.getItem("authToken");
  const isLoggedIn = Boolean(user || authToken);
  const firstName = user?.name?.split(" ")?.[0] || "User";

  const loadCart = () => {
    if (!authToken) {
      setCartItems(getGuestCartItems());
      return;
    }

    axios
      .get("/api/cart-items", {
        headers: { Authorization: `Bearer ${authToken}` },
      })
      .then((response) => {
        setCartItems(response.data || []);
      })
      .catch((error) => {
        if (error.response?.status === 401) {
          setCartItems([]);
          return;
        }

        console.error("Error loading cart:", error);
      });
  };

  useEffect(() => {
    loadCart();
  }, [cartRefreshKey]);

  const totalQuantity = useMemo(() => {
    if (!authToken) {
      return getGuestCartTotalQuantity();
    }

    return cartItems.reduce(
      (sum, cartItem) => sum + (Number(cartItem.quantity) || 0),
      0
    );
  }, [authToken, cartItems]);

  return (
    <header className="header">
      <div className="left-section">
        <Link to="/" className="header-link">
          <img className="logo" src="/images/logo-white.png" alt="logo" />
          <img className="mobile-logo" src="/images/mobile-logo-white.png" alt="mobile logo" />
        </Link>
      </div>

      <div className="middle-section">
        <input className="search-bar" type="text" placeholder="Search" />

        <button className="search-button" type="button">
          <img className="search-icon" src="/images/icons/search-icon.png" alt="search" />
        </button>
      </div>

      <div className="right-section">
        {isLoggedIn ? (
          <>
            <button
              type="button"
              className="user-badge header-link"
              onClick={() => navigate("/profile")}
              style={{
                color: "#fff",
                fontSize: "0.85rem",
                padding: "6px 10px",
                borderRadius: "999px",
                background: "rgba(255,255,255,0.12)",
                border: "1px solid rgba(255,255,255,0.14)",
              }}
            >
              Hi, {firstName}
            </button>
            <button
              type="button"
              className="logout-link header-link"
              onClick={() => {
                onLogout?.();
                navigate("/");
              }}
            >
              <span className="login-text">Logout</span>
            </button>
          </>
        ) : (
          <button type="button" className="login-link header-link" onClick={() => navigate("/login")}>
            <img className="login-icon" src="/images/login-icon.png" alt="login" />
            <span className="login-text">Login</span>
          </button>
        )}
        <button type="button" className="orders-link header-link" onClick={() => navigate("/orders")}>
          <span className="orders-text">Orders</span>
        </button>
        <button type="button" className="cart-link header-link" onClick={() => navigate("/checkout")}>
          <img className="cart-icon" src="/images/icons/cart-icon.png" alt="cart" />
          <div className="cart-quantity">{totalQuantity}</div>
          <div className="cart-text">Cart</div>
        </button>
      </div>
    </header>
  );
}
