import axios from "axios";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";

import { Header } from "../../components/Header";
import { SUBCATEGORIES_BY_CATEGORY } from "../../utils/categories";
import {
  buildCategoryCounts,
  filterHomeProducts,
  withClassification,
} from "../../utils/homeCatalog";
import ProductsGrid from "./productsGrid";
import "./HomePage.css";

export function HomePage({ quantityByProduct, setQuantityByProduct, user, onLogout }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get("q") || "";
  const category = searchParams.get("category") || "";
  const subcategory = searchParams.get("sub") || "";

  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [addedProductId, setAddedProductId] = useState(null);
  const [cartRefreshKey, setCartRefreshKey] = useState(0);

  useEffect(() => {
    let isMounted = true;

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

  const classifiedProducts = useMemo(() => withClassification(products), [products]);
  const categoryCounts = useMemo(() => buildCategoryCounts(classifiedProducts), [classifiedProducts]);
  const visibleProducts = useMemo(
    () => filterHomeProducts(classifiedProducts, { query, category, subcategory }),
    [classifiedProducts, query, category, subcategory],
  );

  const updateFilters = (next) => {
    const params = new URLSearchParams(searchParams);
    Object.entries(next).forEach(([key, value]) => {
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
    });
    setSearchParams(params);
  };

  const subcategoryOptions = category
    ? [
        ...(SUBCATEGORIES_BY_CATEGORY[category] || []),
      ].filter((name) => categoryCounts[category]?.subcategories[name])
    : [];

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
          <>
          <nav className="home-filters" aria-label="Product categories">
            <div className="home-filter-row">
              <button
                type="button"
                className={`home-chip ${!category ? "active" : ""}`}
                onClick={() => updateFilters({ category: "", sub: "" })}
              >
                All ({classifiedProducts.length})
              </button>
              {Object.entries(categoryCounts).map(([name, info]) => (
                <button
                  key={name}
                  type="button"
                  className={`home-chip ${category === name ? "active" : ""}`}
                  onClick={() => updateFilters({ category: name, sub: "" })}
                >
                  {name} ({info.total})
                </button>
              ))}
            </div>
            {subcategoryOptions.length > 0 && (
              <div className="home-filter-row">
                {subcategoryOptions.map((name) => (
                  <button
                    key={name}
                    type="button"
                    className={`home-chip home-chip-sub ${subcategory === name ? "active" : ""}`}
                    onClick={() => updateFilters({ sub: subcategory === name ? "" : name })}
                  >
                    {name} ({categoryCounts[category].subcategories[name]})
                  </button>
                ))}
              </div>
            )}
            <div className="home-results-summary" aria-live="polite">
              {visibleProducts.length} product{visibleProducts.length === 1 ? "" : "s"}
              {query ? ` for "${query}"` : ""}
            </div>
          </nav>
          {visibleProducts.length === 0 ? (
            <div className="home-page-loading">No products match your search.</div>
          ) : (
          <ProductsGrid
            products={visibleProducts}
            quantityByProduct={quantityByProduct}
            setQuantityByProduct={setQuantityByProduct}
            addedProductId={addedProductId}
            handleAddToCart={handleAddToCart}
            handleQuantityChange={handleQuantityChange}
          />
          )}
          </>
        )}
      </main>
   </>
  );
}
