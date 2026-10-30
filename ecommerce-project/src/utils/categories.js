export const PRODUCT_TAXONOMY = [
  "Vehicles",
  "Appliances",
  "Smart Phones",
  "Fashion",
  "Beauty",
  "Food",
  "Const. Materials",
  "Tools",
  "Furniture",
  "Gift Cards",
];

export const SUBCATEGORIES_BY_CATEGORY = {
  Vehicles: ["Cars", "Suv", "Trucks", "Buses", "Pickups"],
  Appliances: ["Kitchen", "Office", "Home", "Electromics", "Computers"],
  "Const. Materials": [
    "Doors",
    "Windows",
    "Floor Tiles",
    "Ceiling Paints",
    "Keys",
    "Electrical Fittings",
    "Electrical Wires",
    "Others",
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
