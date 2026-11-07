import axios from "axios";
import { useEffect, useState } from "react";

import { useCart } from "../../context/useCart";
import { OrderSummary } from "./orderSummary";
import { PaymentSummary } from "./paymentSummary";
import { ShippingAddressForm } from "./ShippingAddressForm";
import { loadShippingAddress } from "../../utils/shippingAddress";
import "./CheckoutHeader.css";
import "./CheckoutPage.css";

export function CheckoutPage({ onCartChange }) {
  const { refreshCartCount } = useCart();
  const [cartItems, setCartItems] = useState([]);
  const [deliveryOptions, setDeliveryOptions] = useState([]);
  const [summary, setSummary] = useState({
    totalItems: 0,
    productCostCents: 0,
    shippingCostCents: 0,
    totalCostBeforeTaxCents: 0,
    taxCents: 0,
    totalCostCents: 0,
  });
  const [loading, setLoading] = useState(true);
  const [shippingAddress, setShippingAddress] = useState(loadShippingAddress);
  const [addressErrors, setAddressErrors] = useState({});
  const [cartMessage, setCartMessage] = useState("");

  const onAddressChange = (key, value) => {
    setShippingAddress((current) => ({ ...current, [key]: value }));
    setAddressErrors((current) => ({ ...current, [key]: undefined }));
  };
  const calculateSummary = (items, options) => {
    const totalItems = items.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);
    const productCostCents = items.reduce(
      (sum, item) => sum + (Number(item.product?.priceCents) || 0) * (Number(item.quantity) || 0),
      0
    );
    const shippingCostCents = items.reduce((sum, item) => {
      const selectedOption = options.find((option) => option.id === item.deliveryOptionId) || options[0];
      return sum + (Number(selectedOption?.priceCents) || 0);
    }, 0);

    const totalCostBeforeTaxCents = productCostCents + shippingCostCents;
    const taxCents = Math.round(totalCostBeforeTaxCents * 0.1);

    return {
      totalItems,
      productCostCents,
      shippingCostCents,
      totalCostBeforeTaxCents,
      taxCents,
      totalCostCents: totalCostBeforeTaxCents + taxCents,
    };
  };

  const loadCheckoutData = async () => {
    try {
      const [deliveryOptionsResponse, paymentSummaryResponse, cartResponse] = await Promise.all([
        axios.get("/api/delivery-options?expand=estimatedDeliveryTime"),
        axios.get("/api/payment-summary"),
        axios.get("/api/cart-items?expand=product"),
      ]);

      const nextDeliveryOptions = deliveryOptionsResponse.data || [];
      const nextCartItems = cartResponse.data || [];

      setCartItems(nextCartItems);
      setDeliveryOptions(nextDeliveryOptions);

      const nextSummary = calculateSummary(nextCartItems, nextDeliveryOptions);
      setSummary({
        ...nextSummary,
        ...(paymentSummaryResponse?.data || {}),
      });
    } catch (error) {
      console.error("Error loading checkout data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;

    const fetchCheckoutData = async () => {
      try {
        const [deliveryOptionsResponse, paymentSummaryResponse, cartResponse] = await Promise.all([
          axios.get("/api/delivery-options?expand=estimatedDeliveryTime"),
          axios.get("/api/payment-summary"),
          axios.get("/api/cart-items?expand=product"),
        ]);

        if (!isMounted) {
          return;
        }

        const nextDeliveryOptions = deliveryOptionsResponse.data || [];
        const nextCartItems = cartResponse.data || [];

        setCartItems(nextCartItems);
        setDeliveryOptions(nextDeliveryOptions);
        setSummary({
          ...calculateSummary(nextCartItems, nextDeliveryOptions),
          ...(paymentSummaryResponse?.data || {}),
        });
      } catch (error) {
        console.error("Error loading checkout data:", error);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchCheckoutData();

    return () => {
      isMounted = false;
    };
  }, []);

  const cartItemUrl = (productId, size) =>
    `/api/cart-items/${productId}${size ? `?size=${encodeURIComponent(size)}` : ""}`;

  const onQuantityChange = async (productId, quantity, size = "") => {
    try {
      await axios.put(cartItemUrl(productId, size), { quantity });
      await loadCheckoutData();
      await refreshCartCount();
      onCartChange?.();
    } catch (error) {
      console.error("Error updating cart quantity:", error);
      setCartMessage(error?.response?.data?.error || "We could not update the quantity.");
    }
  };

  const onRemoveItem = async (productId, size = "") => {
    try {
      await axios.delete(cartItemUrl(productId, size));
      await loadCheckoutData();
      await refreshCartCount();
      onCartChange?.();
    } catch (error) {
      console.error("Error removing cart item:", error);
    }
  };

  const onDeliveryOptionChange = async (productId, deliveryOptionId, size = "") => {
    try {
      await axios.put(cartItemUrl(productId, size), { deliveryOptionId });
      await loadCheckoutData();
      await refreshCartCount();
      onCartChange?.();
    } catch (error) {
      console.error("Error updating delivery option:", error);
    }
  };

  return (
    <div className="checkout-page">
      <div className="page-title">Review your order</div>
      {cartMessage && <div className="shipping-address-error" role="alert">{cartMessage}</div>}

      {loading ? (
        <div className="checkout-loading">Loading your cart...</div>
      ) : cartItems.length === 0 ? (
        <div className="empty-cart">Your cart is empty.</div>
      ) : (
        <div className="checkout-grid">
          <OrderSummary
            cartItems={cartItems}
            deliveryOptions={deliveryOptions}
            onQuantityChange={onQuantityChange}
            onRemoveItem={onRemoveItem}
            onDeliveryOptionChange={onDeliveryOptionChange}
          />

          <div>
            <ShippingAddressForm address={shippingAddress} errors={addressErrors} onChange={onAddressChange} />
            <PaymentSummary
              paymentSummary={summary}
              shippingAddress={shippingAddress}
              onAddressInvalid={setAddressErrors}
            />
          </div>
        </div>
      )}
    </div>
  );
}
