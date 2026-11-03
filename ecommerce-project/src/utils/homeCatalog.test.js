import { describe, expect, it } from "vitest";
import { classifyHomeProduct, filterHomeProducts, withClassification } from "./homeCatalog";

describe("homeCatalog", () => {
  it("maps products to categories and subcategories", () => {
    expect(classifyHomeProduct({ name: "Black and Gray Athletic Cotton Socks - 6 Pairs" })).toEqual({ category: "Fashion", subcategory: "Accoutrements" });
    expect(classifyHomeProduct({ name: "Women's Summer Jean Shorts" })).toEqual({ category: "Fashion", subcategory: "Women Clothing" });
    expect(classifyHomeProduct({ name: "2 Slot Toaster - White" })).toEqual({ category: "Appliances", subcategory: "Kitchen" });
    expect(classifyHomeProduct({ name: "Intermediate Composite Basketball" }).category).toBe("Other");
    expect(classifyHomeProduct({ name: "PVC Pipe 2 inch" })).toEqual({ category: "Const. Materials", subcategory: "Plumb. Mat. & Fittings" });
    expect(classifyHomeProduct({ name: "Brass Faucet", category: "Const. Materials" })).toEqual({ category: "Const. Materials", subcategory: "Plumb. Mat. & Fittings" });
  });

  it("filters by search text, category and subcategory", () => {
    const products = withClassification([
      { id: 1, name: "2 Slot Toaster - White", keywords: ["kitchen"] },
      { id: 2, name: "Men Athletic Shoes", keywords: [] },
      {
        id: 3,
        name: "Marketplace Backpack",
        keywords: ["bag"],
        details: { category: "Fashion", subcategory: "Accoutrements" },
      },
    ]);
    expect(filterHomeProducts(products, { query: "toaster" })).toHaveLength(1);
    expect(filterHomeProducts(products, { category: "Fashion", subcategory: "Men Shoes" })).toHaveLength(1);
    expect(filterHomeProducts(products, { category: "Appliances", subcategory: "Home" })).toHaveLength(0);
    expect(filterHomeProducts(products, { query: "Accoutrements" })).toHaveLength(1);
  });
});
