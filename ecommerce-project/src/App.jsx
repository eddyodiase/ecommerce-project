

import { Routes, Route } from "react-router-dom";
import { useState } from "react";
import { HomePage } from "./pages/home/HomePage";
import { CheckoutPage } from "./pages/checkout/CheckoutPage";
import { OrdersPage } from "./pages/orders/OrdersPage";
import { TrackingPage } from "./pages/TrackingPage";
import { CheckoutHeader } from "./pages/checkout/CheckoutHeader";
import "./App.css";

function App() {
  const [quantityByProduct, setQuantityByProduct] = useState({});
  const [cartRefreshKey, setCartRefreshKey] = useState(0);

  const refreshCart = () => {
    setCartRefreshKey((current) => current + 1);
  };

  return (
    <Routes>
      <Route
        index
        element={
          <HomePage
            quantityByProduct={quantityByProduct}
            setQuantityByProduct={setQuantityByProduct}
          />
        }
      />
      <Route
        path="checkout"
        element={
          <>
            <CheckoutHeader cartRefreshKey={cartRefreshKey} />
            <CheckoutPage
              quantityByProduct={quantityByProduct}
              onCartChange={refreshCart}
            />
          </>
        }
      />
      <Route
        path="orders"
        element={<OrdersPage quantityByProduct={quantityByProduct} onCartChange={refreshCart} />}
      />
      <Route path="tracking" element={<TrackingPage />} />
    </Routes>
  );
}

export default App;
