
import { Fragment } from "react";
import { formatMoney } from "../../utils/money";    
export function productGrid(products, quantityByProduct, addedProductId, handleQuantityChange, handleAddToCart) {
  return (

    <Fragment>
    
               <div className="products-grid">
         {products.map((product) => {
           const selectedQuantity = quantityByProduct[product.id] ?? 1;
           const isAdded = addedProductId === product.id;
           return (
             <div key={product.id} className="product-container">
               <div className="product-image-container">
                 <img className="product-image" src={product.image} alt={product.name} />
               </div>
               <div className="product-name limit-text-to-2-lines">{product.name}</div>
               <div className="product-rating-container">
                 <img
                   className="product-rating-stars"
                   src={`/images/ratings/rating-${product.rating.stars * 10}.png`}
                   alt={`${product.rating.stars} star rating`}
                 />
                 <div className="product-rating-count link-primary">{product.rating.count}</div>
               </div>
               <div className="product-price">
                 {formatMoney(product.priceCents)}
               </div>
               <div className="product-quantity-container">
                 <select
                   value={selectedQuantity}
                   onChange={(event) => handleQuantityChange(product.id, event.target.value)}
                 >
                   {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((value) => (
                     <option key={value} value={value}>{value}</option>
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
                 onClick={() => handleAddToCart(product)}
               >
                 Add to Cart
               </button>
             </div>
           );
         })}
           </div>
               <div className="products-grid">
         {products.map((product) => {
           const selectedQuantity = quantityByProduct[product.id] ?? 1;
           const isAdded = addedProductId === product.id;
           return (
             <div key={product.id} className="product-container">
               <div className="product-image-container">
                 <img className="product-image" src={product.image} alt={product.name} />
               </div>
               <div className="product-name limit-text-to-2-lines">{product.name}</div>
               <div className="product-rating-container">
                 <img
                   className="product-rating-stars"
                   src={`/images/ratings/rating-${product.rating.stars * 10}.png`}
                   alt={`${product.rating.stars} star rating`}
                 />
                 <div className="product-rating-count link-primary">{product.rating.count}</div>
               </div>
               <div className="product-price">
                 {formatMoney(product.priceCents)}
               </div>
               <div className="product-quantity-container">
                 <select
                   value={selectedQuantity}
                   onChange={(event) => handleQuantityChange(product.id, event.target.value)}
                 >
                   {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((value) => (
                     <option key={value} value={value}>{value}</option>
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
                 onClick={() => handleAddToCart(product)}
               >
                 Add to Cart
               </button>
             </div>
           );
         })}
           </div>
  
  </Fragment    >
    
  );
}