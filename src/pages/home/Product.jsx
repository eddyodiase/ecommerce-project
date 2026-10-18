

import { formatMoney } from "../../utils/money";


export function Product({
  product,
  quantity,
  onQuantityChange,
  onAddToCart,
  isAdded,
}) {
  const selectedQuantity = quantity ?? 1;


  const handleQuantityChange = (nextQuantity) => {
    onQuantityChange?.(product.id, Number(nextQuantity));
  };


  const handleAddToCart = () => {
    onAddToCart?.(product, selectedQuantity);
  };


  return (
    <div key={product.id} className="product-container">
      <div className="product-image-container">
        <img className="product-image" 
        data-testid="product-image"
        src={product.image} alt={product.name} />
      </div>


      <div className="product-name limit-text-to-2-lines">{product.name}</div>


      <div className="product-rating-container">
        <img
          className="product-rating-stars"
          src={`/images/ratings/rating-${product.rating.stars * 10}.png`}
          alt={`${product.rating.stars} star rating`}
          data-testid="product-rating-stars"
        />
        <div className="product-rating-count link-primary" data-testid="product-rating-count">
          {product.rating.count}
        </div>
      </div>


      <div className="product-price">{formatMoney(product.priceCents)}</div>


      <div className="product-quantity-container">
        <select
          value={selectedQuantity}
          onChange={(event) => handleQuantityChange(event.target.value)}
        >
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((value) => (
            <option key={value} value={value}>
              {value}
            </option>
          ))}
        </select>
      </div>


      <div className="product-spacer"></div>


      <div className={`added-to-cart ${isAdded ? "visible" : ""}`}>
        <img src="/images/icons/checkmark.png" alt="Added" />
        Added
      </div>


      <button
        className="add-to-cart-button button-primary"
        type="button"
        data-testid="add-to-cart-button"
        onClick={handleAddToCart}
      >
        Add to Cart
      </button>
    </div>
  );
}

