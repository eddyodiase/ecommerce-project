
import dayjs from "dayjs";
import { toCurrency } from "../../utils/money";

export function OrderSummary({
  cartItems,
  deliveryOptions,
  handleQuantityUpdate,
  handleDelete,
  handleDeliveryOptionChange,
}) {
  return (
     <div className="order-summary">
    {cartItems.map((item) => {
      const product = item.product || {};
      const selectedDeliveryOption =
        deliveryOptions.find((option) => option.id === item.deliveryOptionId) ||
        deliveryOptions[0];
      return (
        <div key={item.productId} className="cart-item-container">
          <div className="delivery-date">
            Delivery date: {selectedDeliveryOption
              ? dayjs(selectedDeliveryOption.estimatedDeliveryTimeMs).format("MMM D")
              : "As scheduled"}
          </div>
          <div className="cart-item-details-grid">
            <img className="product-image" src={product.image} alt={product.name} />
            <div className="cart-item-details">
              <div className="product-name">{product.name}</div>
              <div className="product-price">{toCurrency(product.priceCents || 0)}</div>
              <div className="product-quantity">
                <span>Quantity:</span>
                <select
                  className="quantity-selector"
                  value={item.quantity || 1}
                  onChange={(event) =>
                    handleQuantityUpdate(item.productId, Number(event.target.value))
                  }
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((value) => (
                    <option key={value} value={value}>
                      {value}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  className="delete-quantity-link"
                  onClick={() => handleDelete(item.productId)}
                >
                  Delete
                </button>
              </div>
            </div>
            <div className="delivery-options">
              <div className="delivery-options-title">Choose a delivery option:</div>
              {deliveryOptions.map((option) => (
                <label key={option.id} className="delivery-option">
                  <input
                    className="delivery-option-input"
                    type="radio"
                    name={`delivery-option-${item.productId}`}
                    checked={selectedDeliveryOption?.id === option.id}
                    onChange={() => handleDeliveryOptionChange(item.productId, option.id)}
                  />
                  <div>
                    <div className="delivery-option-date">
                      {dayjs(option.estimatedDeliveryTimeMs).format("MMM D")}
                    </div>
                    <div className="delivery-option-price">
                      {option.priceCents === 0
                        ? "Free"
                        : `${toCurrency(option.priceCents)} - Shipping`}
                    </div>
                  </div>
                </label>
              ))}
            </div>
          </div>
        </div>
      );
    })}
  </div>


    )}                 