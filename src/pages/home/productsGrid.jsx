
import { Fragment } from "react";
import { Product } from "./Product";

export default function ProductsGrid({
  products,
  quantityByProduct,
  addedProductId,
  handleQuantityChange,
  handleAddToCart,
}) {
  return (
    <Fragment>
      <div className="products-grid">
        {products.map((product) => {
          const selectedQuantity = quantityByProduct[product.id] ?? 1;
          const isAdded = addedProductId === product.id;

          return (
            <Product
              key={product.id}
              product={product}
              quantity={selectedQuantity}
              isAdded={isAdded}
              onQuantityChange={handleQuantityChange}
              onAddToCart={handleAddToCart}
            />
          );
        })}
      </div>
    </Fragment>
  );
}