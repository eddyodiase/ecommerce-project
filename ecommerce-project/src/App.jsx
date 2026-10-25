

import axios from "axios";
import { Navigate, Routes, Route } from "react-router-dom";
import { useEffect, useState } from "react";
import { HomePage } from "./pages/home/HomePage";
import { CheckoutPage } from "./pages/checkout/CheckoutPage";
import { OrdersPage } from "./pages/orders/OrdersPage";
import { TrackingPage } from "./pages/TrackingPage";
import { CheckoutHeader } from "./pages/checkout/CheckoutHeader";
import { LoginPage } from "./pages/login/LoginPage";
import { RegisterPage } from "./pages/register/RegisterPage";
import { ProfilePage } from "./pages/profile/ProfilePage";
import { ProductsSearchPage } from "./pages/products/ProductsSearchPage";
import "./App.css";

function getStoredAuth() {
  if (typeof window === "undefined") {
    return { token: null, user: null };
  }

  const token = localStorage.getItem("authToken");
  const savedUser = localStorage.getItem("authUser");

  if (!token || !savedUser) {
    return { token: null, user: null };
  }

  try {
    return { token, user: JSON.parse(savedUser) };
  } catch (error) {
    console.error("Unable to read saved user:", error);
    return { token: null, user: null };
  }
}

function App() {
  const [quantityByProduct, setQuantityByProduct] = useState({});
  const [cartRefreshKey, setCartRefreshKey] = useState(0);
  const [auth, setAuth] = useState(() => getStoredAuth());

  useEffect(() => {
    const { token, user } = getStoredAuth();

    if (!token) {
      return;
    }

    axios
      .get("/api/me", {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((response) => {
        setAuth({
          token,
          user: response.data?.user || user,
        });
      })
      .catch(() => {
        localStorage.removeItem("authToken");
        localStorage.removeItem("authUser");
        setAuth({ token: null, user: null });
      });
  }, []);

  const refreshCart = () => {
    setCartRefreshKey((current) => current + 1);
  };

  const isAuthenticated = Boolean(auth.token);

  const handleLogin = (loggedInUser, token) => {
    localStorage.setItem("authToken", token);
    localStorage.setItem("authUser", JSON.stringify(loggedInUser));
    setAuth({ token, user: loggedInUser });
  };

  const handleRegister = (newUser, token) => {
    handleLogin(newUser, token);
  };

  const handleLogout = () => {
    localStorage.removeItem("authToken");
    localStorage.removeItem("authUser");
    setAuth({ token: null, user: null });
  };

  return (
    <Routes>
      <Route
        index
        element={
          <HomePage
            quantityByProduct={quantityByProduct}
            setQuantityByProduct={setQuantityByProduct}
            user={auth.user}
            onLogout={handleLogout}
          />
        }
      />
      <Route
        path="login"
        element={isAuthenticated ? <Navigate to="/" replace /> : <LoginPage onLogin={handleLogin} />}
      />
      <Route
        path="register"
        element={isAuthenticated ? <Navigate to="/" replace /> : <RegisterPage onRegister={handleRegister} />}
      />
      <Route
        path="profile"
        element={isAuthenticated ? <ProfilePage user={auth.user} onLogout={handleLogout} /> : <Navigate to="/login" replace />}
      />
      <Route
        path="checkout"
        element={
          <>
            <CheckoutHeader cartRefreshKey={cartRefreshKey} user={auth.user} onLogout={handleLogout} />
            <CheckoutPage
              quantityByProduct={quantityByProduct}
              onCartChange={refreshCart}
            />
          </>
        }
      />
      <Route
        path="orders"
        element={
          isAuthenticated ? (
            <OrdersPage
              quantityByProduct={quantityByProduct}
              onCartChange={refreshCart}
              user={auth.user}
              onLogout={handleLogout}
            />
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />
      <Route path="tracking" element={<TrackingPage />} />
      <Route path="products" element={<ProductsSearchPage />} />
    </Routes>
  );
}

export default App;
