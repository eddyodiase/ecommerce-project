
import dayjs from "dayjs";
import { toCurrency } from "../../utils/money";
import { DeliveryOptions } from "./DeliveryOptions";

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

              <DeliveryOptions
                deliveryOptions={deliveryOptions}
                item={item}
                selectedDeliveryOption={selectedDeliveryOption}
                handleDeliveryOptionChange={handleDeliveryOptionChange}
              />
              
            </div>
          </div>
        );
      })}
    </div>
  );
}