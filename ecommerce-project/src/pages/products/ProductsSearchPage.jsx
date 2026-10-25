import axios from "axios";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import "./ProductsSearchPage.css";

const PAGE_SIZE = 48;
const CATEGORY_LINKS = [
  "All",
  "Best Sellers",
  "Gift Cards",
  "Home",
  "Electronics",
  "Fashion",
  "Beauty",
  "Office",
];

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
    image: "/images/products/vanity-mirror-pink.jpg",
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
    category: "Kitchen",
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
    image: "/images/products/luxury-towel-set.jpg",
    badge: "Best Seller",
  },
];

const buildSampleProducts = () => {
  const items = [];

  for (let index = 0; index < 98; index += 1) {
    const base = RAW_PRODUCTS[index % RAW_PRODUCTS.length];
    const priceStep = (index % 9) * 650;

    items.push({
      ...base,
      id: `${base.id}-${index + 1}`,
      title: `${base.title} ${index > 0 ? index + 1 : ""}`.trim(),
      price: base.price + priceStep,
      rating: Number(Math.min(5, Number((base.rating + (index % 3) * 0.1).toFixed(1))).toFixed(1)),
      reviewCount: base.reviewCount + index * 23,
      badge: index % 4 === 0 ? "Overall Pick" : index % 3 === 0 ? "Best Seller" : "New",
      seller: `${base.seller} ${index % 2 === 0 ? "Co" : ""}`.trim(),
    });
  }

  return items;
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
  const [isLoading, setIsLoading] = useState(false);
  const [cartCount, setCartCount] = useState(() => Number(localStorage.getItem("cartCount") || 0));

  const brandOptions = ["NorthPeak", "Aurelia", "Peak & Co", "HomeStyle", "Nestline", "Edgewell"];
  const deliveryTypeOptions = ["Free delivery", "Next day", "Standard"];
  const cardTypeOptions = ["Visa", "Mastercard", "Gift cards", "PayPal"];
  const sellerOptions = ["NorthPeak Living", "HomeStyle Living", "Peak & Co", "Aurelia Beauty", "Edgewell Studio"];

  const loadProducts = useCallback(async () => {
    const params = {
      q: searchTerm,
      category: selectedCategory === "All" ? "" : selectedCategory,
      brand: selectedBrands.join(",") || undefined,
      rating: selectedRatings.length ? Math.min(...selectedRatings) : undefined,
      sort: sortBy,
      page,
    };

    setIsLoading(true);

    try {
      const response = await axios.get("/api/products", {
        params,
        timeout: 1500,
      });

      const nextProducts = Array.isArray(response.data)
        ? response.data
        : response.data?.products || [];

      if (nextProducts.length > 0) {
        setProducts(nextProducts);
      }
    } catch (error) {
      console.error("Using sample product data fallback:", error);
      setProducts(buildSampleProducts());
    } finally {
      setIsLoading(false);
    }
  }, [page, searchTerm, selectedBrands, selectedCardTypes, selectedCategory, selectedDeliveryTypes, selectedRatings, selectedSellers, sortBy]);

  useEffect(() => {
    void loadProducts();
  }, [loadProducts]);

  const filteredProducts = useMemo(() => {
    const sourceProducts = products.length ? products : buildSampleProducts();

    return [...sourceProducts]
      .filter((product) => {
        const query = searchTerm.toLowerCase().trim();
        const matchesSearch =
          !query ||
          product.title.toLowerCase().includes(query) ||
          product.subtitle.toLowerCase().includes(query) ||
          product.brand.toLowerCase().includes(query) ||
          product.category.toLowerCase().includes(query);

        const matchesCategory =
          selectedCategory === "All" || product.category === selectedCategory;

        const matchesBrand =
          selectedBrands.length === 0 || selectedBrands.includes(product.brand);

        const matchesDelivery =
          selectedDeliveryTypes.length === 0 || selectedDeliveryTypes.includes(product.deliveryType);

        const matchesCard =
          selectedCardTypes.length === 0 || selectedCardTypes.includes(product.cardType);

        const matchesSeller =
          selectedSellers.length === 0 || selectedSellers.includes(product.seller);

        const matchesRating =
          selectedRatings.length === 0 || selectedRatings.some((rating) => product.rating >= Number(rating));

        return (
          matchesSearch &&
          matchesCategory &&
          matchesBrand &&
          matchesDelivery &&
          matchesCard &&
          matchesSeller &&
          matchesRating
        );
      })
      .sort((left, right) => {
        if (sortBy === "price-low") return left.price - right.price;
        if (sortBy === "price-high") return right.price - left.price;
        if (sortBy === "rating") return right.rating - left.rating;
        return (right.rating * 1000 + right.reviewCount) - (left.rating * 1000 + left.reviewCount);
      });
  }, [products, searchTerm, selectedCategory, selectedBrands, selectedDeliveryTypes, selectedCardTypes, selectedRatings, selectedSellers, sortBy]);

  const totalResults = filteredProducts.length;
  const totalPages = Math.max(1, Math.ceil(totalResults / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageProducts = filteredProducts.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);
  const resultStart = totalResults === 0 ? 0 : (safePage - 1) * PAGE_SIZE + 1;
  const resultEnd = Math.min(safePage * PAGE_SIZE, totalResults);

  useEffect(() => {
    setPage(1);
  }, [searchTerm, selectedCategory, selectedBrands.join(","), selectedDeliveryTypes.join(","), selectedCardTypes.join(","), selectedRatings.join(","), selectedSellers.join(",")]);

  const handleAddToCart = (product) => {
    const currentCount = Number(localStorage.getItem("cartCount") || 0);
    const nextCount = currentCount + 1;
    localStorage.setItem("cartCount", String(nextCount));
    setCartCount(nextCount);
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

                    <button type="button" className="add-to-cart-button" onClick={() => handleAddToCart(product)}>
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
