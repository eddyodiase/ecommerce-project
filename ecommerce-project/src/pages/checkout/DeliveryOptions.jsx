import dayjs from "dayjs";
import { toCurrency } from "../../utils/money";

export function DeliveryOptions({
  deliveryOptions,
  item,
  selectedDeliveryOption,
  handleDeliveryOptionChange,
}) {
  return (
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
  );
}
