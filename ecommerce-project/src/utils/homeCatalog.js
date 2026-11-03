export const UNCATEGORIZED = "Other";

// Ordered rules: first match wins, so specific rules come before generic ones.
const CLASSIFICATION_RULES = [
  { category: "Fashion", subcategory: "Women Shoes", pattern: /\b(women|ladies)\b.*\b(shoe|sandal|heel|flat|sneaker|boot)s?\b/ },
  { category: "Fashion", subcategory: "Men Shoes", pattern: /\b(shoe|sneaker|boot|loafer|sandal)s?\b/ },
  { category: "Fashion", subcategory: "Accoutrements", pattern: /\b(sunglass(es)?|earrings?|hat|sunhat|beanie|socks?|jewelry|watch|belt|scarf|cap)\b/ },
  { category: "Fashion", subcategory: "kids Fashion", pattern: /\b(kids?|children|boys?|girls?)\b/ },
  { category: "Fashion", subcategory: "Women Clothing", pattern: /\b(women|ladies|dress|skirt|blouse|leggings?)\b/ },
  { category: "Fashion", subcategory: "Mens Clothing", pattern: /\b(men|mens|t-?shirt|shirt|polo|hoodie|sweater|pants|chino|jeans?|shorts)\b/ },
  { category: "Const. Materials", subcategory: "Plumb. Mat. & Fittings", pattern: /\b(plumbing|plumber|pipes?|pvc|faucets?|taps?|valves?|fittings?|elbows?|couplings?|flanges?|drains?|toilets?|sinks?|water ?closet|cistern|showerheads?)\b/ },
  { category: "Beauty", subcategory: "Bathroom Textiles", pattern: /\b(towel|shower curtain)s?\b/ },
  { category: "Beauty", subcategory: "Cleaning & Maintenance", pattern: /\b(clean(er|ing)?|soap|sponge|brush)s?\b/ },
  { category: "Beauty", subcategory: "Hygiene & Grooming", pattern: /\b(makeup|cosmetic|beauty|skincare|perfume|lotion|shampoo|razor|toothbrush|deodorant)s?\b/ },
  { category: "Beauty", subcategory: "Fixtures & Accessories", pattern: /\b(mirror|fixture|dispenser|holder)s?\b/ },
  { category: "Appliances", subcategory: "Kitchen", pattern: /\b(toaster|blender|kettle|espresso|coffee|cooking|cookware|bowl|plate|dinner|container|pan|pot|microwave|fryer|utensil)s?\b/ },
  { category: "Appliances", subcategory: "Computers", pattern: /\b(laptop|computer|keyboard|monitor|mouse)\b/ },
  { category: "Appliances", subcategory: "Electromics", pattern: /\b(tv|television|speaker|headphone|camera|charger|electronic)s?\b/ },
  { category: "Appliances", subcategory: "Home", pattern: /\b(towel|curtain|duvet|bedding|mat|bath|tissue|detergent|laundry|paper|blanket|pillow)s?\b/ },
  { category: "Smart Phones", subcategory: "", pattern: /\b(phone|smartphone|iphone|android)s?\b/ },
  { category: "Vehicles", subcategory: "Suv", pattern: /\bsuvs?\b/ },
  { category: "Vehicles", subcategory: "Trucks", pattern: /\btrucks?\b/ },
  { category: "Vehicles", subcategory: "Buses", pattern: /\bbus(es)?\b/ },
  { category: "Vehicles", subcategory: "Pickups", pattern: /\bpickups?\b/ },
  { category: "Vehicles", subcategory: "Cars", pattern: /\b(car|vehicle)s?\b/ },
  { category: "Tools", subcategory: "Welding Supplies", pattern: /\bwelding\b/ },
  { category: "Tools", subcategory: "Tool Boxes", pattern: /\btool ?box(es)?\b/ },
  { category: "Tools", subcategory: "Farm Tools", pattern: /\b(farm|hoe|shovel|rake|machete)s?\b/ },
  { category: "Tools", subcategory: "Builders Tools", pattern: /\b(tool|drill|hammer)s?\b/ },
  { category: "Furniture", subcategory: "Office Furniture", pattern: /\boffice\b.*\b(chair|desk|table)s?\b/ },
  { category: "Furniture", subcategory: "Home Furniture", pattern: /\b(sofa|chair|table|desk|bed|shelf|furniture)s?\b/ },
  { category: "Food", subcategory: "Oils", pattern: /\boils?\b/ },
  { category: "Food", subcategory: "Fresh", pattern: /\b(fresh|fruit|vegetable|tomato|onion|pepper|yam)s?\b/ },
  { category: "Food", subcategory: "Groceries", pattern: /\b(food|snack|rice|grocery|groceries)\b/ },
];

const normalize = (value) => String(value ?? "").toLowerCase();

export const classifyHomeProduct = (product = {}) => {
  const keywords = Array.isArray(product.keywords) ? product.keywords : [];
  const details = product.details && typeof product.details === "object" ? product.details : {};
  const explicitCategory = product.category || details.category;
  const explicitSubcategory = product.subcategory || details.subcategory;

  if (explicitSubcategory) {
    return {
      category: explicitCategory || UNCATEGORIZED,
      subcategory: explicitSubcategory,
    };
  }

  // Name is checked first so keyword noise can't override an explicit title match.
  const sources = [normalize(product.name), normalize(keywords.join(" "))];

  for (const source of sources) {
    for (const rule of CLASSIFICATION_RULES) {
      if (explicitCategory && rule.category !== explicitCategory) {
        continue;
      }
      if (rule.pattern.test(source)) {
        return { category: rule.category, subcategory: rule.subcategory };
      }
    }
  }

  return { category: explicitCategory || UNCATEGORIZED, subcategory: "" };
};

export const withClassification = (products) =>
  products.map((product) => ({ ...product, ...classifyHomeProduct(product) }));

export const matchesHomeSearch = (product, query) => {
  const terms = normalize(query).split(/\s+/).filter(Boolean);
  if (terms.length === 0) {
    return true;
  }

  const haystack = [
    product.name,
    ...(Array.isArray(product.keywords) ? product.keywords : []),
    product.category,
    product.subcategory,
  ]
    .map(normalize)
    .join(" ");

  return terms.every((term) => haystack.includes(term));
};

export const filterHomeProducts = (products, { query = "", category = "", subcategory = "" } = {}) =>
  products.filter(
    (product) =>
      matchesHomeSearch(product, query)
      && (!category || product.category === category)
      && (!subcategory || product.subcategory === subcategory),
  );

// Only categories/subcategories that actually have products on the page.
export const buildCategoryCounts = (products) => {
  const counts = {};
  products.forEach((product) => {
    const entry = (counts[product.category] ??= { total: 0, subcategories: {} });
    entry.total += 1;
    if (product.subcategory) {
      entry.subcategories[product.subcategory] = (entry.subcategories[product.subcategory] || 0) + 1;
    }
  });
  return counts;
};
