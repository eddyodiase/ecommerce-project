
import { Routes, Route } from "react-router-dom"
import { HomePage } from "./pages/HomePage"
import { CheckoutPage } from "./pages/checkout/CheckoutPage"
import { OrdersPage } from "./pages/OrdersPage"
import { TrackingPage } from "./pages/TrackingPage"
import { CheckoutHeader } from "./pages/checkout/CheckoutHeader"
import "./App.css"

function App() {
  return (
    <Routes>
      <Route index element={<HomePage />} />
      <Route
        path="checkout"
        element={
          <>
            <CheckoutHeader />
            <CheckoutPage />
          </>
        }
      />
      <Route path="orders" element={<OrdersPage />} />
      <Route path="tracking" element={<TrackingPage />} />
    </Routes>
  )
}

export default App
