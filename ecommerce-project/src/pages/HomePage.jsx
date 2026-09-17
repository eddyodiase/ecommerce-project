import axios from "axios";
import { useEffect, useState } from "react";
import { Header } from "../components/Header";
import "./HomePage.css";

export function HomePage() {
  const [products, setProducts] = useState([]);
  const [cartItems, setCartItems] = useState([]);

  useEffect(() => {
    axios
      .get("http://localhost:3000/api/products")
      .then((response) => {
        setProducts(response.data);
      })
      .catch((error) => {
        console.error("Error loading products:", error);
      });

      axios
      .get("http://localhost:3000/api/cart-items")
      .then((response) => {
        setCartItems("Cart data:", response.data);
      })
      .catch((error) => {
        console.error("Error loading cart:", error);
      });
  }, []);

  return (
    <>
      <Header cartItems={cartItems} />
      <main className="home-page">
        <div className="products-grid">
          {products.map((product) => (
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

              <div className="product-price">${(product.priceCents / 100).toFixed(2)}</div>

              <div className="product-quantity-container">
                <select defaultValue="1">
                  <option value="1">1</option>
                  <option value="2">2</option>
                  <option value="3">3</option>
                  <option value="4">4</option>
                  <option value="5">5</option>
                  <option value="6">6</option>
                  <option value="7">7</option>
                  <option value="8">8</option>
                  <option value="9">9</option>
                  <option value="10">10</option>
                </select>
              </div>

              <div className="product-spacer"></div>

              <div className="added-to-cart">
                <img src="/images/icons/checkmark.png" alt="Added" />
                Added
              </div>

              <button className="add-to-cart-button button-primary">Add to Cart</button>
            </div>
          ))}
        </div>
      </main>
    </>
  );
}
   