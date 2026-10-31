import { describe, expect, it } from "vitest";
import { classifyHomeProduct, filterHomeProducts, withClassification } from "./homeCatalog";

describe("homeCatalog", () => {
  it("maps products to categories and subcategories", () => {
    expect(classifyHomeProduct({ name: "Black and Gray Athletic Cotton Socks - 6 Pairs" })).toEqual({ category: "Fashion", subcategory: "Accoutrements" });
    expect(classifyHomeProduct({ name: "Women's Summer Jean Shorts" })).toEqual({ category: "Fashion", subcategory: "Women Clothing" });
    expect(classifyHomeProduct({ name: "2 Slot Toaster - White" })).toEqual({ category: "Appliances", subcategory: "Kitchen" });
    expect(classifyHomeProduct({ name: "Intermediate Composite Basketball" }).category).toBe("Other");
  });

  it("filters by search text, category and subcategory", () => {
    const products = withClassification([
      { id: 1, name: "2 Slot Toaster - White", keywords: ["kitchen"] },
      { id: 2, name: "Men Athletic Shoes", keywords: [] },
    ]);
    expect(filterHomeProducts(products, { query: "toaster" })).toHaveLength(1);
    expect(filterHomeProducts(products, { category: "Fashion", subcategory: "Men Shoes" })).toHaveLength(1);
    expect(filterHomeProducts(products, { category: "Appliances", subcategory: "Home" })).toHaveLength(0);
  });
});
