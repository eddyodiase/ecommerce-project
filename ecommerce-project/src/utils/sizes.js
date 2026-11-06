const CLOTHING_SIZES = ["XS", "S", "M", "L", "XL", "XXL", "XXXL"];
const SHOE_SIZES = ["36", "37", "38", "39", "40", "41", "42", "43", "44", "45", "46", "47"];
const KIDS_SIZES = ["0-6M", "6-12M", "1-2Y", "3-4Y", "5-6Y", "7-8Y", "9-10Y", "11-12Y"];
const ACCESSORY_SIZES = ["One Size", "S", "M", "L", "XL"];

const SIZES_BY_SUBCATEGORY = {
  "Mens Clothing": CLOTHING_SIZES,
  "Women Clothing": CLOTHING_SIZES,
  "Men Shoes": SHOE_SIZES,
  "Women Shoes": SHOE_SIZES,
  "kids Fashion": KIDS_SIZES,
  Accoutrements: ACCESSORY_SIZES,
  "Sports - Shoes": SHOE_SIZES,
  "Sports - Apparels": CLOTHING_SIZES,
};

export const isFashionCategory = (category) => String(category || "").trim().toLowerCase() === "fashion";

export const isQuantityOnlyFashionProduct = (category, subcategory) => (
  isFashionCategory(category)
  && String(subcategory || "").trim().toLowerCase() === "sports - sports goods"
);

// Listing subcategories can include a nested choice, such as "Sports - Shoes".
export const getSizeOptions = (category, subcategory, nestedSubcategory = "") => {
  if (!isFashionCategory(category)) {
    return [];
  }
  const [base, embeddedNested] = String(subcategory || "").split(" - ");
  const nested = nestedSubcategory || embeddedNested || "";
  const key = nested ? `${base} - ${nested}` : base;
  return SIZES_BY_SUBCATEGORY[key] || SIZES_BY_SUBCATEGORY[base] || [];
};

/** Keeps only sizes with a whole, positive quantity, as { size: quantity }. */
export const toSizeStock = (quantities) => {
  const result = {};
  Object.entries(quantities || {}).forEach(([size, value]) => {
    const quantity = Number(value);
    if (Number.isInteger(quantity) && quantity > 0) {
      result[size] = quantity;
    }
  });
  return result;
};

export const hasSizeStock = (sizeStock) => (
  Boolean(sizeStock) && typeof sizeStock === "object" && Object.keys(sizeStock).length > 0
);

/** Sorts a { size: quantity } map into display order for the product's size list. */
export const sortSizeEntries = (sizeStock, category, subcategory) => {
  const order = getSizeOptions(category, subcategory);
  return Object.entries(sizeStock || {}).sort(([a], [b]) => {
    const indexA = order.indexOf(a);
    const indexB = order.indexOf(b);
    return (indexA === -1 ? order.length : indexA) - (indexB === -1 ? order.length : indexB);
  });
};
