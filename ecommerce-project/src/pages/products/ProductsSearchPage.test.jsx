import { describe, expect, it } from "vitest";

import { buildSampleProducts, inferCategoryFromKeywords, matchesCategoryFilter, sortProducts } from "./ProductsSearchPage";

describe("ProductsSearchPage sample data", () => {
  it("uses distinct images within each category so category cards do not repeat the same photo", () => {
    const products = buildSampleProducts();
    const categories = ["Home", "Electronics", "Fashion", "Beauty", "Office"];

    categories.forEach((category) => {
      const categoryProducts = products.filter((product) => product.category === category);
      const uniqueImages = new Set(categoryProducts.map((product) => product.image));

      expect(categoryProducts.length).toBeGreaterThan(0);
      expect(uniqueImages.size).toBe(categoryProducts.length);
    });
  });

  it("sorts products by price and rating according to the selected selected sort option", () => {
    const products = [
      { id: "low", price: 2000, rating: 3.5 },
      { id: "mid", price: 5000, rating: 4.7 },
      { id: "high", price: 9000, rating: 4.1 },
    ];

    expect(sortProducts(products, "price-low").map((product) => product.id)).toEqual(["low", "mid", "high"]);
    expect(sortProducts(products, "price-high").map((product) => product.id)).toEqual(["high", "mid", "low"]);
    expect(sortProducts(products, "rating").map((product) => product.id)).toEqual(["mid", "high", "low"]);
  });

  it("uses exact matching for category selections instead of loose partial matches", () => {
    const products = [
      { category: "Home", badge: "Best Seller" },
      { category: "Fashion", badge: "New" },
      { category: "Beauty", badge: "Overall Pick" },
    ];

    expect(matchesCategoryFilter("Home", products[0])).toBe(true);
    expect(matchesCategoryFilter("Home", products[1])).toBe(false);
    expect(matchesCategoryFilter("Fashion", products[1])).toBe(true);
    expect(matchesCategoryFilter("Beauty", products[2])).toBe(true);
  });

  it("maps striped beach dress and round sunglasses to Fashion for backend products", () => {
    const stripedBeachDressCategory = inferCategoryFromKeywords([
      "Women's Striped Beach Dress",
      "robe",
      "swimsuit",
      "swimming",
      "bathing",
      "apparel",
    ]);

    const roundSunglassesCategory = inferCategoryFromKeywords([
      "Round Sunglasses",
      "accessories",
      "shades",
    ]);

    expect(stripedBeachDressCategory).toBe("Fashion");
    expect(roundSunglassesCategory).toBe("Fashion");
  });
});
