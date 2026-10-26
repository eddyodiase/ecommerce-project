import axios from "axios";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { useCart } from "../../context/CartContext";
import "./ProductsSearchPage.css";

const PAGE_SIZE = 48;
export const PRODUCT_TAXONOMY = [
  "Home",
  "Electronics",
  "Fashion",
  "Beauty",
  "Office",
  "Gift Cards",
];
const CATEGORY_LINKS = [
  "All",
  "Best Sellers",
  ...PRODUCT_TAXONOMY,
];

const BACKEND_CATEGORY_KEYWORDS = {
  Home: ["home", "kitchen", "bath", "living"],
  Electronics: ["electronics", "tech", "device"],
  Fashion: ["fashion", "clothing", "apparel", "shoe"],
  Beauty: ["beauty", "cosmetic", "care"],
  Office: ["office", "work", "desk", "school"],
  "Gift Cards": ["gift", "card"],
};

const inferCategoryFromKeywords = (keywords = []) => {
  const normalizedKeywords = keywords.map((keyword) => String(keyword || "").toLowerCase());
  for (const [category, terms] of Object.entries(BACKEND_CATEGORY_KEYWORDS)) {
    if (terms.some((term) => normalizedKeywords.some((keyword) => keyword.includes(term)))) {
      return category;
    }
  }

  return "Home";
};

const normalizeBackendProduct = (product = {}) => {
  const ratingValue = Number(product.rating?.stars || 0);
  const category = inferCategoryFromKeywords(product.keywords || []);

  return {
    id: product.id,
    title: product.name || "Product",
    subtitle: (product.keywords || []).slice(0, 3).join(" • ") || "Featured item",
    brand: "NorthPeak",
    category,
    seller: "NorthPeak Marketplace",
    deliveryType: "Standard",
    cardType: "Visa",
    price: Number(product.priceCents || 0),
    rating: ratingValue,
    reviewCount: Number(product.rating?.count || 0),
    image: product.image,
    badge: ratingValue >= 4.5 ? "Best Seller" : "",
  };
};

const normalizeCategoryKey = (value) => String(value || "").trim().toLowerCase().replace(/[^a-z0-9]+/g, " ").replace(/\s+/g, " ").trim();

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
    category: "Electronics",
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
    category: "Office",
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
    category: "Office",
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

const getSampleProductMatch = (product, query, category, brandFilters, deliveryFilters, cardFilters, sellerFilters, ratingFilters) => {
    const normalizedQuery = query.toLowerCase().trim();
    const matchesSearch =
      !normalizedQuery ||
      [product.title, product.subtitle, product.brand, product.category, product.seller]
        .some((value) => value?.toLowerCase().includes(normalizedQuery));

    const matchesCategory = matchesCategoryFilter(category, product);
    const matchesBrand = brandFilters.length === 0 || brandFilters.includes(product.brand);
    const matchesDelivery = deliveryFilters.length === 0 || deliveryFilters.includes(product.deliveryType);
    const matchesCard = cardFilters.length === 0 || cardFilters.includes(product.cardType);
    const matchesSeller = sellerFilters.length === 0 || sellerFilters.includes(product.seller);
    const matchesRating = ratingFilters.length === 0 || ratingFilters.some((rating) => Number(product.rating) >= Number(rating));

    return matchesSearch && matchesCategory && matchesBrand && matchesDelivery && matchesCard && matchesSeller && matchesRating;
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

const formatNaira = (value) =>
  new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));

const toggleSelection = (value, selectedValues, setSelectedValues) => {
  if (selectedValues.includes(value)) {
    setSelectedValues(selectedValues.filter((entry) => entry !== value));
    return;
  }

  setSelectedValues([...selectedValues, value]);
};

export function ProductsSearchPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedBrands, setSelectedBrands] = useState([]);
  const [selectedDeliveryTypes, setSelectedDeliveryTypes] = useState([]);
  const [selectedCardTypes, setSelectedCardTypes] = useState([]);
  const [selectedRatings, setSelectedRatings] = useState([]);
  const [selectedSellers, setSelectedSellers] = useState([]);
  const [sortBy, setSortBy] = useState("featured");
  const [page, setPage] = useState(1);
  const [products, setProducts] = useState(() => buildSampleProducts());
  const [totalResults, setTotalResults] = useState(98);
  const [totalPages, setTotalPages] = useState(3);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { cartCount, addToCart } = useCart();

  const brandOptions = ["NorthPeak", "Aurelia", "Peak & Co", "HomeStyle", "Nestline", "Edgewell"];
  const deliveryTypeOptions = ["Free delivery", "Next day", "Standard"];
  const cardTypeOptions = ["Visa", "Mastercard", "Gift cards", "PayPal"];
  const sellerOptions = ["NorthPeak Living", "HomeStyle Living", "Peak & Co", "Aurelia Beauty", "Edgewell Studio"];

  const loadProducts = useCallback(async () => {
    const params = {
      search: searchTerm.trim() || undefined,
    };

    setIsLoading(true);

    try {
      const response = await axios.get("/api/products", {
        params,
        timeout: 1500,
      });

      const payload = response.data || {};
      const backendProducts = Array.isArray(payload)
        ? payload
        : payload.products || [];
      const normalizedProducts = backendProducts.map(normalizeBackendProduct);

      const fallbackSource = normalizedProducts.length > 0 ? normalizedProducts : buildSampleProducts();
      const filteredProducts = fallbackSource.filter((product) => getSampleProductMatch(
        product,
        searchTerm,
        selectedCategory,
        selectedBrands,
        selectedDeliveryTypes,
        selectedCardTypes,
        selectedSellers,
        selectedRatings
      ));

      const sortedProducts = sortProducts(
        filteredProducts,
        sortBy
      );

      setProducts(sortedProducts);
      setTotalResults(sortedProducts.length);
      setTotalPages(Math.max(1, Math.ceil(sortedProducts.length / PAGE_SIZE)));
    } catch (error) {
      const fallbackProducts = sortProducts(
        buildSampleProducts().filter((product) => getSampleProductMatch(
          product,
          searchTerm,
          selectedCategory,
          selectedBrands,
          selectedDeliveryTypes,
          selectedCardTypes,
          selectedSellers,
          selectedRatings
        )),
        sortBy
      );
      setProducts(fallbackProducts);
      setTotalResults(fallbackProducts.length);
      setTotalPages(Math.max(1, Math.ceil(fallbackProducts.length / PAGE_SIZE)));
    } finally {
      setIsLoading(false);
    }
  }, [page, searchTerm, selectedBrands, selectedCardTypes, selectedCategory, selectedDeliveryTypes, selectedRatings, selectedSellers, sortBy]);

  useEffect(() => {
    void loadProducts();
  }, [loadProducts]);

  const safePage = Math.min(page, totalPages);
  const pageProducts = products.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);
  const resultStart = totalResults === 0 ? 0 : (safePage - 1) * PAGE_SIZE + 1;
  const resultEnd = Math.min(safePage * PAGE_SIZE, totalResults);

  useEffect(() => {
    setPage(1);
  }, [searchTerm, selectedCategory, selectedBrands.join(","), selectedDeliveryTypes.join(","), selectedCardTypes.join(","), selectedRatings.join(","), selectedSellers.join(",")]);

  const handleAddToCart = async (productId) => {
    try {
      await addToCart(productId, 1);
    } catch (error) {
      console.error("Error adding product to cart:", error);
    }
  };

  return (
    <div className="search-results-page">
      <header className="search-header">
        <div className="header-top-row">
          <Link to="/" className="brand-link">
            <span className="brand-mark">N</span>
            <span>NorthPeak</span>
          </Link>

          <div className="header-search-wrap">
            <label className="search-category">
              <select value={selectedCategory} onChange={(event) => setSelectedCategory(event.target.value)}>
                {CATEGORY_LINKS.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </label>
            <input
              type="text"
              value={searchTerm}
              placeholder="Search for products, brands, and more"
              onChange={(event) => setSearchTerm(event.target.value)}
            />
            <button
              type="button"
              className="primary-search-button"
              onClick={() => {
                setPage(1);
                void loadProducts();
              }}
            >
              Search
            </button>
          </div>

          <nav className="utility-links" aria-label="Account and cart menu">
            <Link to="/login">Account</Link>
            <Link to="/orders">Orders</Link>
            <Link to="/admin">Admin</Link>
            <button
              type="button"
              className="sell-link-button"
              onClick={() => {
                setSelectedCategory("All");
                setSearchTerm("");
                setPage(1);
                navigate("/sell");
              }}
            >
              Sell
            </button>
            <Link to="/checkout" className="cart-link">
              Cart <span>{cartCount}</span>
            </Link>
          </nav>
        </div>

        <div className="secondary-nav">
          {CATEGORY_LINKS.map((category) => (
            <button
              key={category}
              type="button"
              className={selectedCategory === category ? "secondary-link active" : "secondary-link"}
              onClick={() => setSelectedCategory(category)}
            >
              {category}
            </button>
          ))}
        </div>
      </header>

      <main className="results-shell">
        <aside className="filter-sidebar">
          <div className="filter-section">
            <h3>Delivery Type</h3>
            {deliveryTypeOptions.map((option) => (
              <label key={option} className="check-row">
                <input
                  type="checkbox"
                  aria-label={option}
                  checked={selectedDeliveryTypes.includes(option)}
                  onChange={() => toggleSelection(option, selectedDeliveryTypes, setSelectedDeliveryTypes)}
                />
                <span>{option}</span>
              </label>
            ))}
          </div>

          <div className="filter-section">
            <h3>Brand</h3>
            {brandOptions.map((option) => (
              <label key={option} className="check-row">
                <input
                  type="checkbox"
                  aria-label={option}
                  checked={selectedBrands.includes(option)}
                  onChange={() => toggleSelection(option, selectedBrands, setSelectedBrands)}
                />
                <span>{option}</span>
              </label>
            ))}
          </div>

          <div className="filter-section">
            <h3>Card Type</h3>
            {cardTypeOptions.map((option) => (
              <label key={option} className="check-row">
                <input
                  type="checkbox"
                  aria-label={option}
                  checked={selectedCardTypes.includes(option)}
                  onChange={() => toggleSelection(option, selectedCardTypes, setSelectedCardTypes)}
                />
                <span>{option}</span>
              </label>
            ))}
          </div>

          <div className="filter-section">
            <h3>Customer Review</h3>
            {[5, 4, 3, 2, 1].map((stars) => (
              <label key={stars} className="check-row star-filter-row">
                <input
                  type="checkbox"
                  aria-label={`${stars} stars & up`}
                  checked={selectedRatings.includes(String(stars))}
                  onChange={() => toggleSelection(String(stars), selectedRatings, setSelectedRatings)}
                />
                <span className="star-filter">
                  {Array.from({ length: 5 }, (_, index) => (
                    <span key={`${stars}-${index}`} className={index < stars ? "filled" : ""}>★</span>
                  ))}
                  <span className="star-label">& up</span>
                </span>
              </label>
            ))}
          </div>

          <div className="filter-section">
            <h3>Seller</h3>
            {sellerOptions.map((option) => (
              <label key={option} className="check-row">
                <input
                  type="checkbox"
                  aria-label={option}
                  checked={selectedSellers.includes(option)}
                  onChange={() => toggleSelection(option, selectedSellers, setSelectedSellers)}
                />
                <span>{option}</span>
              </label>
            ))}
          </div>
        </aside>

        <section className="results-panel">
          <div className="results-bar">
            <p>
              {totalResults === 0 ? 0 : resultStart}-{resultEnd} of {totalResults} results
            </p>
            <label className="sort-control">
              <span>Sort by</span>
              <select value={sortBy} onChange={(event) => setSortBy(event.target.value)}>
                <option value="featured">Featured</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
                <option value="rating">Avg. Customer Review</option>
              </select>
            </label>
          </div>

          {isLoading && products.length === 0 ? (
            <div className="loading-state">Loading products...</div>
          ) : pageProducts.length === 0 ? (
            <div className="empty-results">No products match these filters.</div>
          ) : (
            <div className="product-grid">
              {pageProducts.map((product) => (
                <article key={product.id} className="product-card">
                  <div className="product-card-image-wrap">
                    {product.badge ? <span className="product-badge">{product.badge}</span> : null}
                    <img src={product.image} alt={product.title} />
                  </div>

                  <div className="product-card-body">
                    <h4>{product.title}</h4>
                    <p className="product-subtitle">{product.subtitle}</p>

                    <div className="product-rating-row" aria-label={`${product.rating} out of 5 stars`}>
                      <span className="product-stars">
                        {Array.from({ length: 5 }, (_, index) => (
                          <span key={`${product.id}-star-${index}`} className={index < Math.round(product.rating) ? "filled" : ""}>
                            ★
                          </span>
                        ))}
                      </span>
                      <span className="product-review-count">({product.reviewCount})</span>
                    </div>

                    <div className="product-price-row">
                      <strong>{formatNaira(product.price)}</strong>
                    </div>

                    <button type="button" className="add-to-cart-button" onClick={() => handleAddToCart(product.id)}>
                      Add to cart
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}

          <div className="pagination-row">
            <button type="button" disabled={safePage <= 1} onClick={() => setPage((current) => Math.max(1, current - 1))}>
              Previous
            </button>
            <span>
              Page {safePage} of {totalPages}
            </span>
            <button type="button" disabled={safePage >= totalPages} onClick={() => setPage((current) => Math.min(totalPages, current + 1))}>
              Next
            </button>
          </div>
        </section>
      </main>
    </div>
  );
}
