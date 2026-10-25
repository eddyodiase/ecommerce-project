import axios from "axios";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { Header } from "../../components/Header";
import { addGuestCartItem } from "../../utils/cart";
import ProductsGrid from "./productsGrid";
import "./HomePage.css";

export function HomePage({ quantityByProduct, setQuantityByProduct, user, onLogout }) {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [addedProductId, setAddedProductId] = useState(null);
  const [cartRefreshKey, setCartRefreshKey] = useState(0);

  useEffect(() => {
    let isMounted = true;

    setIsLoading(true);

    axios
      .get("/api/products")
      .then((response) => {
        if (!isMounted) {
          return;
        }

        const nextProducts = Array.isArray(response.data)
          ? response.data
          : Array.isArray(response.data?.products)
            ? response.data.products
            : [];

        setProducts(nextProducts);
      })
      .catch((error) => {
        console.error("Error loading products:", error);
      })
      .finally(() => {
        if (isMounted) {
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const handleQuantityChange = (productId, value) => {
    setQuantityByProduct((prev) => ({
      ...prev,
      [productId]: Number(value),
    }));
  };

  const handleAddToCart = async (product) => {
    const token = localStorage.getItem("authToken");
    const quantity = quantityByProduct[product.id] ?? 1;

    if (!token) {
      addGuestCartItem(product, quantity);
      setCartRefreshKey((current) => current + 1);
      setAddedProductId(product.id);
      window.setTimeout(() => {
        setAddedProductId((current) => (current === product.id ? null : current));
      }, 1200);
      return;
    }

    try {
      await axios.post("/api/cart-items", {
        productId: product.id,
        quantity,
      }, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setCartRefreshKey((current) => current + 1);
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
      <Header cartRefreshKey={cartRefreshKey} user={user} onLogout={onLogout} />
      <main className="home-page">
        {isLoading ? (
          <div className="home-page-loading" aria-live="polite">
            Loading products...
          </div>
        ) : (
          <ProductsGrid
            products={products}
            quantityByProduct={quantityByProduct}
            setQuantityByProduct={setQuantityByProduct}
            addedProductId={addedProductId}
            handleAddToCart={handleAddToCart}
            handleQuantityChange={handleQuantityChange}
          />
        )}
      </main>
   </>
  );
}
