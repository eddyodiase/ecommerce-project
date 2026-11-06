import { describe, expect, it } from "vitest";
import {
  getSizeOptions,
  hasSizeStock,
  isQuantityOnlyFashionProduct,
  sortSizeEntries,
  toSizeStock,
} from "./sizes";

describe("sizes", () => {
  it("offers clothing, shoe, kids and accessory sizes for Fashion only", () => {
    expect(getSizeOptions("Fashion", "Mens Clothing")).toContain("XL");
    expect(getSizeOptions("Fashion", "Women Shoes")).toContain("40");
    expect(getSizeOptions("Fashion", "kids Fashion")).toContain("3-4Y");
    expect(getSizeOptions("Fashion", "Accoutrements - Men")).toContain("One Size");
    expect(getSizeOptions("Beauty", "Hygiene & Grooming")).toEqual([]);
    expect(getSizeOptions("Fashion", "")).toEqual([]);
  });

  it("keeps only whole positive quantities", () => {
    expect(toSizeStock({ S: "3", M: "", L: "0", XL: "2.5", XXL: 4 })).toEqual({ S: 3, XXL: 4 });
    expect(hasSizeStock({})).toBe(false);
    expect(hasSizeStock({ S: 1 })).toBe(true);
  });

  it("uses shoe and apparel sizes for nested Fashion Sports listings", () => {
    expect(getSizeOptions("Fashion", "Sports", "Shoes")).toContain("42");
    expect(getSizeOptions("Fashion", "Sports - Apparels")).toContain("XL");
    expect(getSizeOptions("Fashion", "Sports", "Sports Goods")).toEqual([]);
    expect(isQuantityOnlyFashionProduct("Fashion", "Sports - Sports Goods")).toBe(true);
    expect(isQuantityOnlyFashionProduct("Fashion", "Sports - Shoes")).toBe(false);
  });

  it("sorts sizes in display order", () => {
    const sorted = sortSizeEntries({ XL: 1, S: 2, M: 3 }, "Fashion", "Mens Clothing").map(([size]) => size);
    expect(sorted).toEqual(["S", "M", "XL"]);
  });
});
