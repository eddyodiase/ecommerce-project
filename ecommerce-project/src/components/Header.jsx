import axios from "axios";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import "./Header.css";

export function Header({ cartRefreshKey = 0 }) {
  const [cartItems, setCartItems] = useState([]);

  const loadCart = () => {
    axios
      .get("/api/cart-items")
      .then((response) => {
        setCartItems(response.data || []);
      })
      .catch((error) => {
        console.error("Error loading cart:", error);
      });
  };

  useEffect(() => {
    loadCart();
  }, [cartRefreshKey]);

  const totalQuantity = cartItems.reduce(
    (sum, cartItem) => sum + (Number(cartItem.quantity) || 0),
    0
  );

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
        <Link className="orders-link header-link" to="/orders">
          <span className="orders-text">Orders</span>
        </Link>
        <Link className="cart-link header-link" to="/checkout">
          <img className="cart-icon" src="/images/icons/cart-icon.png" alt="cart" />
          <div className="cart-quantity">{totalQuantity}</div>
          <div className="cart-text">Cart</div>
        </Link>
      </div>
    </header>
  );
}
