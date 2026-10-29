import { describe, expect, it } from "vitest";

import {
  NESTED_SUBCATEGORIES_BY_CATEGORY,
  PRODUCT_TAXONOMY,
  SUBCATEGORIES_BY_CATEGORY,
} from "../../utils/categories";
import { buildSampleProducts, inferCategoryFromKeywords, matchesCategoryFilter, sortProducts } from "./productCatalog";

describe("ProductsSearchPage sample data", () => {
  it("includes Fashion subcategories and nested Accoutrements audiences", () => {
    expect(SUBCATEGORIES_BY_CATEGORY.Fashion).toEqual([
      "Mens Clothing",
      "Women Clothing",
      "Men Shoes",
      "Women Shoes",
      "kids Fashion",
      "Accoutrements",
    ]);
    expect(NESTED_SUBCATEGORIES_BY_CATEGORY.Fashion.Accoutrements).toEqual(["Men", "Women"]);
  });

  it("replaces Home with Vehicles and provides its vehicle subcategories", () => {
    expect(PRODUCT_TAXONOMY).toContain("Vehicles");
    expect(PRODUCT_TAXONOMY).not.toContain("Home");
    expect(SUBCATEGORIES_BY_CATEGORY.Vehicles).toEqual([
      "Cars",
      "Suv",
      "Trucks",
      "Buses",
      "Pickups",
    ]);
    expect(inferCategoryFromKeywords(["2024 SUV with four doors"])).toBe("Vehicles");
    expect(inferCategoryFromKeywords(["Pickup truck"])).toBe("Vehicles");
  });

  it("includes Tools with its subcategories and recognizes tool products", () => {
    expect(PRODUCT_TAXONOMY).toContain("Tools");
    expect(SUBCATEGORIES_BY_CATEGORY.Tools).toEqual([
      "Tool Boxes",
      "Farm Tools",
      "Builders Tools",
      "Welding Supplies",
    ]);
    expect(inferCategoryFromKeywords(["Heavy Duty Tool Box"])).toBe("Tools");
    expect(inferCategoryFromKeywords(["Welding Supplies"])).toBe("Tools");
  });

  it("replaces Office with Food and provides its subcategories", () => {
    expect(PRODUCT_TAXONOMY).toContain("Food");
    expect(PRODUCT_TAXONOMY).not.toContain("Office");
    expect(SUBCATEGORIES_BY_CATEGORY.Food).toEqual(["Oils", "Fresh", "Groceries", "NFPD"]);
    expect(inferCategoryFromKeywords(["Cooking oil"])).toBe("Food");
    expect(inferCategoryFromKeywords(["Fresh groceries"])).toBe("Food");
  });

  it("uses distinct images within each category so category cards do not repeat the same photo", () => {
    const products = buildSampleProducts();
    const categories = ["Home", "Electronics", "Fashion", "Beauty", "Food"];

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
