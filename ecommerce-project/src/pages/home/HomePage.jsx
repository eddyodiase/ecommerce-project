import axios from "axios";
import { useEffect, useState } from "react";
import { Header } from "../../components/Header";
import ProductsGrid from "./productsGrid";
import "./HomePage.css";

export function HomePage({ quantityByProduct, setQuantityByProduct }) {
  const [products, setProducts] = useState([]);
  const [addedProductId, setAddedProductId] = useState(null);

  useEffect(() => {
    axios 
      .get("/api/products")
      .then((response) => {
        setProducts(response.data || []);
      })
      .catch((error) => {
        console.error("Error loading products:", error);
      });
  }, []);

  const handleQuantityChange = (productId, value) => {
    setQuantityByProduct((prev) => ({
      ...prev,
      [productId]: Number(value),
    }));
  };

  const handleAddToCart = async (product) => {
    const quantity = quantityByProduct[product.id] ?? 1;

    try {
      await axios.post("/api/cart-items", {
        productId: product.id,
        quantity,
      });

      setAddedProductId(product.id);
      window.setTimeout(() => {
        setAddedProductId((current) => (current === product.id ? null : current));
      }, 1200);
    } catch (error) {
      console.error("Error adding product to cart:", error);
    }
  };

  return (
   <>
      <Header />
      <main className="home-page">
        <ProductsGrid
          products={products}
          quantityByProduct={quantityByProduct}
          setQuantityByProduct={setQuantityByProduct}
          addedProductId={addedProductId}
          handleAddToCart={handleAddToCart}
          handleQuantityChange={handleQuantityChange}
        />
      </main>
   </>
  );
}
