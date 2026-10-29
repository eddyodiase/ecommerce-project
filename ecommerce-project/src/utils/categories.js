export const PRODUCT_TAXONOMY = [
  "Vehicles",
  "Electronics",
  "Smart Phones",
  "Fashion",
  "Beauty",
  "Food",
  "Building Materials",
  "Tools",
  "Furniture",
  "Gift Cards",
];

export const SUBCATEGORIES_BY_CATEGORY = {
  Vehicles: ["Cars", "Suv", "Trucks", "Buses", "Pickups"],
  "Building Materials": [
    "Doors",
    "Windows",
    "Floor Tiles",
    "Ceiling Paints",
    "Cement",
    "Nails",
    "Keys",
    "Electrical Fittings",
    "Electrical Wires",
  ],
  Tools: ["Tool Boxes", "Farm Tools", "Builders Tools", "Welding Supplies"],
  Furniture: ["Home Furniture", "Office Furniture"],
  Food: ["Oils", "Fresh", "Groceries", "NFPD"],
  Fashion: [
    "Mens Clothing",
    "Women Clothing",
    "Men Shoes",
    "Women Shoes",
    "kids Fashion",
    "Accoutrements",
  ],
};

export const NESTED_SUBCATEGORIES_BY_CATEGORY = {
  Fashion: {
    Accoutrements: ["Men", "Women"],
  },
};
