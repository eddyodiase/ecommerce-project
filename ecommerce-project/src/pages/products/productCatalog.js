const BACKEND_CATEGORY_KEYWORDS = {
  Vehicles: ["vehicle", "sedan", "suv", "truck", "bus", "pickup", "van", "automobile", "car"],
  "Const. Materials": ["building materials"],
  Tools: ["tool box", "toolbox", "farm tool", "builder tool", "weld", "tools"],
  Furniture: ["furniture"],
  Home: ["home", "kitchen", "bathroom", "living"],
  Appliances: ["electronics", "tech", "device"],
  "Smart Phones": ["smart phone", "smartphone", "phone", "mobile", "cell phone", "android", "iphone"],
  Fashion: ["fashion", "clothing", "apparel", "shoe", "dress", "swim", "accessories", "sunglass", "shade"],
  Beauty: ["beauty", "cosmetic", "care"],
  Food: ["food", "oil", "fresh", "grocer", "nfpd"],
  "Gift Cards": ["gift", "card"],
};

export const inferCategoryFromKeywords = (keywords = []) => {
  const normalizedKeywords = keywords.map((keyword) => String(keyword || "").toLowerCase());
  for (const [category, terms] of Object.entries(BACKEND_CATEGORY_KEYWORDS)) {
    const matchesCategory = category === "Vehicles"
      ? normalizedKeywords.some((keyword) => /\b(vehicle|sedan|suv|truck|bus|pickup|van|automobile|car)\b/.test(keyword))
      : terms.some((term) => normalizedKeywords.some((keyword) => keyword.includes(term)));

    if (matchesCategory) {
      return category;
    }
  }

  return "Home";
};

export const normalizeCategoryKey = (value) => String(value || "").trim().toLowerCase().replace(/[^a-z0-9]+/g, " ").replace(/\s+/g, " ").trim();

export const matchesCategoryFilter = (category, product) => {
  if (!category || category === "All") {
    return true;
  }

  const normalizedCategory = normalizeCategoryKey(category);
  const productCategory = normalizeCategoryKey(product.category);

  if (category === "Best Sellers") {
    return ["Best Seller", "Overall Pick"].includes(product.badge);
  }

  return productCategory === normalizedCategory;
};

const RAW_PRODUCTS = [
  {
    id: "nexa-phone-1",
    title: "Nexa X9 Pro 5G",
    subtitle: "AI-powered smartphone with 256GB storage",
    brand: "Nexa",
    category: "Smart Phones",
    seller: "Nexa Mobile",
    deliveryType: "Next day",
    cardType: "Visa",
    price: 429000,
    rating: 4.9,
    reviewCount: 6840,
    image: "/images/products/Itel P23 Pro.jpg",
    badge: "Top Rated",
  },
  {
    id: "luma-phone-2",
    title: "Luma Pulse 8",
    subtitle: "Ultra-bright AMOLED display and fast charging",
    brand: "Luma",
    category: "Smart Phones",
    seller: "Luma Tech",
    deliveryType: "Free delivery",
    cardType: "Mastercard",
    price: 348000,
    rating: 4.7,
    reviewCount: 5210,
    image: "/images/products/Savo A05.jpg",
    badge: "Best Seller",
  },
  {
    id: "zenith-phone-3",
    title: "Zenith Aster Max",
    subtitle: "Pocket-friendly flagship with dual cameras",
    brand: "Zenith",
    category: "Smart Phones",
    seller: "Zenith Mobile",
    deliveryType: "Free delivery",
    cardType: "PayPal",
    price: 289000,
    rating: 4.6,
    reviewCount: 4360,
    image: "/images/products/vivo B2 Pro.jpg",
    badge: "Overall Pick",
  },
  {
    id: "nova-phone-4",
    title: "Nova Echo Mini",
    subtitle: "Compact 5G device with all-day battery life",
    brand: "Nova",
    category: "Smart Phones",
    seller: "Nova Devices",
    deliveryType: "Standard",
    cardType: "Gift cards",
    price: 239000,
    rating: 4.5,
    reviewCount: 3090,
    image: "/images/products/blackout-curtain-set-beige.jpg",
    badge: "New",
  },
  {
    id: "northpeak-hook-1",
    title: "NorthPeak Towel Hook",
    subtitle: "Chrome finish bathroom accessory",
    brand: "NorthPeak",
    category: "Home",
    seller: "NorthPeak Living",
    deliveryType: "Free delivery",
    cardType: "Visa",
    price: 6500,
    rating: 4.8,
    reviewCount: 2145,
    image: "/images/products/luxury-towel-set.jpg",
    badge: "Best Seller",
  },
  {
    id: "northpeak-hook-2",
    title: "Aster Wall Shelf",
    subtitle: "Floating wall organizer with brass trim",
    brand: "Aurelia",
    category: "Home",
    seller: "NorthPeak Living",
    deliveryType: "Next day",
    cardType: "Mastercard",
    price: 8400,
    rating: 4.6,
    reviewCount: 1460,
    image: "/images/products/blackout-curtains-set-teal.jpg",
    badge: "Overall Pick",
  },
  {
    id: "northpeak-hook-3",
    title: "Nova LED Desk Lamp",
    subtitle: "Adjustable task light with USB-C power",
    brand: "Peak & Co",
    category: "Appliances",
    seller: "Peak & Co",
    deliveryType: "Free delivery",
    cardType: "Gift cards",
    price: 12250,
    rating: 4.7,
    reviewCount: 3320,
    image: "/images/products/countertop-push-blender-black.jpg",
    badge: "New",
  },
  {
    id: "northpeak-hook-4",
    title: "Cedar Bath Towel Set",
    subtitle: "Ultra-soft 2-piece towel set in soft ivory",
    brand: "HomeStyle",
    category: "Home",
    seller: "HomeStyle Living",
    deliveryType: "Standard",
    cardType: "Visa",
    price: 10800,
    rating: 4.5,
    reviewCount: 1540,
    image: "/images/products/bath-towel-set-gray-rosewood.jpg",
    badge: "Best Seller",
  },
  {
    id: "northpeak-hook-5",
    title: "Noor Premium Gift Card",
    subtitle: "Instant digital gift card, delivered fast",
    brand: "NorthPeak",
    category: "Gift Cards",
    seller: "NorthPeak Rewards",
    deliveryType: "Free delivery",
    cardType: "Gift cards",
    price: 5000,
    rating: 4.9,
    reviewCount: 9820,
    image: "/images/products/black-and-silver-espresso-maker.jpg",
    badge: "Top Rated",
  },
  {
    id: "northpeak-hook-6",
    title: "Cleo Knit Sweater",
    subtitle: "Relaxed fit sweatshirt in ash gray",
    brand: "Edgewell",
    category: "Fashion",
    seller: "Edgewell Studio",
    deliveryType: "Standard",
    cardType: "Mastercard",
    price: 16800,
    rating: 4.4,
    reviewCount: 890,
    image: "/images/products/women-plain-cotton-oversized-sweater-gray.jpg",
    badge: "Overall Pick",
  },
  {
    id: "northpeak-hook-7",
    title: "Mira Glass Food Containers",
    subtitle: "3-piece airtight storage set",
    brand: "Nestline",
    category: "Food",
    seller: "Nestline Home",
    deliveryType: "Free delivery",
    cardType: "Visa",
    price: 9600,
    rating: 4.5,
    reviewCount: 1720,
    image: "/images/products/glass-screw-lid-food-containers.jpg",
    badge: "Best Seller",
  },
  {
    id: "northpeak-hook-8",
    title: "Revel Travel Mug",
    subtitle: "Double-wall insulated stainless steel",
    brand: "Peak & Co",
    category: "Food",
    seller: "Peak & Co",
    deliveryType: "Next day",
    cardType: "PayPal",
    price: 7400,
    rating: 4.7,
    reviewCount: 2850,
    image: "/images/products/electric-steel-hot-water-kettle-white.jpg",
    badge: "Overall Pick",
  },
  {
    id: "northpeak-hook-9",
    title: "Sora Cosmetics Organizer",
    subtitle: "Compact vanity tray with soft-touch finish",
    brand: "Aurelia",
    category: "Beauty",
    seller: "Aurelia Beauty",
    deliveryType: "Free delivery",
    cardType: "Visa",
    price: 7700,
    rating: 4.6,
    reviewCount: 1340,
    image: "/images/products/vanity-mirror-pink.jpg",
    badge: "New",
  },
  {
    id: "northpeak-hook-10",
    title: "Luna Cotton Towel Set",
    subtitle: "Two-tone cotton towels for everyday use",
    brand: "NorthPeak",
    category: "Home",
    seller: "NorthPeak Living",
    deliveryType: "Free delivery",
    cardType: "Mastercard",
    price: 9200,
    rating: 4.4,
    reviewCount: 1200,
    image: "/images/products/blackout-curtain-set-beige.jpg",
    badge: "Best Seller",
  },
];

const ALL_PRODUCT_IMAGES = [
  "/images/products/athletic-cotton-socks-6-pairs.jpg",
  "/images/products/intermediate-composite-basketball.jpg",
  "/images/products/adults-plain-cotton-tshirt-2-pack-teal.jpg",
  "/images/products/2-slot-toaster-white.jpg",
  "/images/products/elegant-white-dinner-plate-set.jpg",
  "/images/products/3-piece-cooking-set.jpg",
  "/images/products/women-plain-cotton-oversized-sweater-gray.jpg",
  "/images/products/luxury-towel-set.jpg",
  "/images/products/facial-tissue-2-ply-8-boxes.jpg",
  "/images/products/women-striped-beach-dress.jpg",
  "/images/products/women-sandal-heels-white-pink.jpg",
  "/images/products/round-sunglasses-gold.jpg",
  "/images/products/blackout-curtain-set-beige.jpg",
  "/images/products/women-summer-jean-shorts.jpg",
  "/images/products/electric-steel-hot-water-kettle-white.jpg",
  "/images/products/knit-athletic-sneakers-gray.jpg",
  "/images/products/straw-sunhat.jpg",
  "/images/products/men-athletic-shoes-white.jpg",
  "/images/products/men-stretch-wool-sweater-black.jpg",
  "/images/products/bathroom-mat.jpg",
  "/images/products/women-knit-ballet-flat-white.jpg",
  "/images/products/men-golf-polo-t-shirt-gray.jpg",
  "/images/products/laundry-detergent-tabs.jpg",
  "/images/products/sky-leaf-branch-earrings.jpg",
  "/images/products/duvet-cover-set-gray-queen.jpg",
  "/images/products/women-knit-beanie-pom-pom-blue.jpg",
  "/images/products/men-chino-pants-beige.jpg",
  "/images/products/men-navigator-sunglasses-black.jpg",
  "/images/products/men-brown-flat-sneakers.jpg",
  "/images/products/non-stick-cooking-set-4-pieces.jpg",
  "/images/products/vanity-mirror-pink.jpg",
  "/images/products/women-relaxed-lounge-pants-pink.jpg",
  "/images/products/crystal-zirconia-stud-earrings-pink.jpg",
  "/images/products/glass-screw-lid-food-containers.jpg",
  "/images/products/black-and-silver-espresso-maker.jpg",
  "/images/products/blackout-curtains-set-teal.jpg",
  "/images/products/bath-towel-set-gray-rosewood.jpg",
  "/images/products/athletic-skateboard-shoes-gray.jpg",
  "/images/products/countertop-push-blender-black.jpg",
  "/images/products/men-cozy-fleece-hoodie-light-teal.jpg",
  "/images/products/artistic-bowl-set-6-piece.jpg",
  "/images/products/kitchen-paper-towels-8-pack.jpg",
];

export const buildSampleProducts = () => {
  const items = [];
  const categoryCounts = {};

  for (let index = 0; index < 98; index += 1) {
    const base = RAW_PRODUCTS[index % RAW_PRODUCTS.length];
    const priceStep = (index % 9) * 650;
    const categoryPosition = categoryCounts[base.category] ?? 0;
    categoryCounts[base.category] = categoryPosition + 1;
    const imageOffset = (categoryPosition * 13 + base.category.length) % ALL_PRODUCT_IMAGES.length;

    items.push({
      ...base,
      id: `${base.id}-${index + 1}`,
      title: `${base.title} ${index > 0 ? index + 1 : ""}`.trim(),
      price: base.price + priceStep,
      rating: Number(Math.min(5, Number((base.rating + (index % 3) * 0.1).toFixed(1))).toFixed(1)),
      reviewCount: base.reviewCount + index * 23,
      badge: index % 4 === 0 ? "Overall Pick" : index % 3 === 0 ? "Best Seller" : "New",
      seller: `${base.seller} ${index % 2 === 0 ? "Co" : ""}`.trim(),
      image: ALL_PRODUCT_IMAGES[imageOffset],
    });
  }

  return items;
};

export const sortProducts = (items, sortBy) => {
  const nextItems = [...items];

  switch (sortBy) {
    case "price-low":
      return nextItems.sort((left, right) => Number(left.price) - Number(right.price));
    case "price-high":
      return nextItems.sort((left, right) => Number(right.price) - Number(left.price));
    case "rating":
      return nextItems.sort((left, right) => Number(right.rating) - Number(left.rating));
    case "featured":
    default:
      return nextItems;
  }
};
