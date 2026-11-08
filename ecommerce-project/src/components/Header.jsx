import axios from "axios";
import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

import { BrandMark } from "./BrandMark";
import "./Header.css";

export function Header({ cartRefreshKey = 0 }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchTerm, setSearchTerm] = useState(() => new URLSearchParams(location.search).get("q") || "");
  const [cartItems, setCartItems] = useState([]);

  const loadCart = () => {
    axios
      .get("/api/cart-items")
      .then((response) => {
        const nextCartItems = Array.isArray(response.data)
          ? response.data
          : Array.isArray(response.data?.cartItems)
            ? response.data.cartItems
            : [];

        setCartItems(nextCartItems);
      })
      .catch((error) => {
        setCartItems([]);
        console.error("Error loading cart:", error);
      });
  };

  useEffect(() => {
    loadCart();
  }, [cartRefreshKey]);

  const totalQuantity = useMemo(() => {
    return cartItems.reduce(
      (sum, cartItem) => sum + (Number(cartItem.quantity) || 0),
      0
    );
  }, [cartItems]);

  return (
    <header className="header">
      <div className="left-section">
        <Link to="/" className="header-link">
          <span className="brand-link">
            <BrandMark className="brand-mark" />
            <span>Zambba</span>
          </span>
        </Link>
      </div>

      <form
        className="middle-section"
        role="search"
        onSubmit={(event) => {
          event.preventDefault();
          const term = searchTerm.trim();
          navigate(term ? `/?q=${encodeURIComponent(term)}` : "/");
        }}
      >
        <div className="search-input-wrapper">
          <input
            className="search-bar"
            type="text"
            placeholder="Search"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
          />
          {searchTerm && (
            <button
              type="button"
              className="search-clear-button"
              aria-label="Clear search"
              onClick={() => {
                setSearchTerm("");
                if (new URLSearchParams(location.search).get("q")) {
                  navigate("/");
                }
              }}
            >
              ×
            </button>
          )}
        </div>

        <button className="search-button" type="submit">
          <img className="search-icon" src="/images/icons/search-icon.png" alt="search" />
        </button>
      </form>

      <div className="right-section">
        <button type="button" className="login-link header-link" onClick={() => navigate("/login")}>
          <img className="login-icon" src="/images/login-icon.png" alt="login" />
          <span className="login-text">LOGIN</span>
        </button>
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
