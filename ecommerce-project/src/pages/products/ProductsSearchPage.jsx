import {
  NESTED_SUBCATEGORIES_BY_CATEGORY,
  PRODUCT_TAXONOMY,
  SUBCATEGORIES_BY_CATEGORY,
} from "../../utils/categories";
import axios from "axios";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { useCart } from "../../context/CartContext";
import { syncSellerListings } from "../../utils/sellerListings";
import {
  buildSampleProducts,
  inferCategoryFromKeywords,
  matchesCategoryFilter,
  normalizeCategoryKey,
  sortProducts,
} from "./productCatalog";
import "./ProductsSearchPage.css";

const PAGE_SIZE = 48;
const SELLER_LISTINGS_STORAGE_KEY = "sellerListings";
const CATEGORY_LINKS = [
  "All",
  "Best Sellers",
  ...PRODUCT_TAXONOMY,
];

const CATEGORY_BRANDS = {
  "All": [
    "NorthPeak",
    "Aurelia",
    "Peak & Co",
    "HomeStyle",
    "Nestline",
    "Edgewell",
    "Nexa",
    "Luma",
    "Zenith",
    "Nova",
  ],
  Vehicles: ["NorthPeak"],
  "Electronics": ["Peak & Co", "Nexa", "Luma", "Zenith", "Nova"],
  "Smart Phones": ["Nexa", "Luma", "Zenith", "Nova"],
  Fashion: ["NorthPeak", "Edgewell"],
  Beauty: ["Aurelia", "NorthPeak"],
  Food: ["Nestline", "Peak & Co", "HomeStyle"],
  "Gift Cards": ["NorthPeak", "Peak & Co"],
  "Building Materials": ["NorthPeak"],
  Tools: ["NorthPeak"],
  Furniture: ["NorthPeak", "HomeStyle", "Nestline"],
  "Best Sellers": ["NorthPeak", "Aurelia", "Peak & Co", "HomeStyle", "Nestline", "Edgewell", "Nexa", "Luma", "Zenith", "Nova"],
};

const inferSubcategoryFromKeywords = (category, keywords = []) => {
  const options = SUBCATEGORIES_BY_CATEGORY[category] || [];
  const normalizedKeywords = keywords.map((keyword) => String(keyword || "").toLowerCase());
  return options.find((option) => normalizedKeywords.includes(option.toLowerCase())) || "";
};

const normalizeBackendImagePath = (image) => {
  if (!image || typeof image !== "string") {
    return image;
  }

  const absolutePath = image.startsWith("/") ? image : `/${image.replace(/^\.?\//, "")}`;
  return encodeURI(absolutePath);
};

const normalizeBackendProduct = (product = {}) => {
  const ratingValue = Number(product.rating?.stars || 0);
  const category = inferCategoryFromKeywords([product.name, ...(product.keywords || [])]);

  return {
    id: product.id,
    title: product.name || "Product",
    subtitle: (product.keywords || []).slice(0, 3).join(" • ") || "Featured item",
    brand: "NorthPeak",
    category,
    subcategory: inferSubcategoryFromKeywords(category, product.keywords),
    seller: "NorthPeak Marketplace",
    deliveryType: "Standard",
    cardType: "Visa",
    price: Number(product.priceCents || 0),
    rating: ratingValue,
    reviewCount: Number(product.rating?.count || 0),
    image: normalizeBackendImagePath(product.image),
    badge: ratingValue >= 4.5 ? "Best Seller" : "",
    phoneSpecs: product.phoneSpecs,
    originLocation: product.originLocation || "Warehouse - NG",
  };
};

const normalizeSellerListingImagePath = (image) => {
  if (!image || typeof image !== "string") {
    return "/images/products/Itel%20P23%20Pro.jpg";
  }

  if (image.startsWith("data:") || image.startsWith("blob:")) {
    return image;
  }

  return normalizeBackendImagePath(image);
};

const readApprovedSellerListings = () => {
  try {
    const listings = JSON.parse(localStorage.getItem(SELLER_LISTINGS_STORAGE_KEY) || "[]");
    if (!Array.isArray(listings)) {
      return [];
    }

    return listings
      .filter((listing) => listing?.status === "approved")
      .map((listing) => {
        const isSmartPhone = normalizeCategoryKey(listing.category) === "smart phones";
        const phoneSpecs = listing.phoneSpecs || {};
        const listingImages = Array.isArray(listing.imageDataUrls)
          ? listing.imageDataUrls
          : [listing.imageDataUrl || listing.imageUrl].filter(Boolean);
        const normalizedListingImages = listingImages.map((image) => normalizeSellerListingImagePath(image)).filter(Boolean);

        return {
          id: listing.id,
          title: listing.productName || "Seller listing",
          subtitle: listing.description || "Seller listed product",
          brand: phoneSpecs.brand || listing.sellerName || "Marketplace Seller",
          category: listing.category || "Vehicles",
          subcategory: listing.subcategory || "",
          seller: listing.sellerName || "Marketplace Seller",
          originLocation: listing.originLocation || "Not specified",
          deliveryType: "Standard",
          cardType: "Visa",
          price: Number(listing.price || 0),
          rating: 4.5,
          reviewCount: 0,
          image: normalizedListingImages[0] || normalizeSellerListingImagePath(listing.imageDataUrl || listing.imageUrl),
          galleryImages: normalizedListingImages,
          badge: "Seller Pick",
          phoneSpecs: isSmartPhone
            ? {
              brand: phoneSpecs.brand || listing.sellerName || "Marketplace Seller",
              ramOptionsGb: Array.isArray(phoneSpecs.ramOptionsGb) ? phoneSpecs.ramOptionsGb : [],
              storageOptionsGb: Array.isArray(phoneSpecs.storageOptionsGb) ? phoneSpecs.storageOptionsGb : [],
              os: phoneSpecs.os || "",
              batteryMah: Number(phoneSpecs.batteryMah) || undefined,
              cameraMp: Number(phoneSpecs.cameraMp) || undefined,
            }
            : undefined,
        };
      });
  } catch {
    return [];
  }
};

const getSampleProductMatch = (product, query, category, brandFilters, deliveryFilters, cardFilters, sellerFilters, ratingFilters, subcategory = "") => {
    const normalizedQuery = query.toLowerCase().trim();
    const matchesSearch =
      !normalizedQuery ||
      [product.title, product.subtitle, product.brand, product.category, product.subcategory, product.seller]
        .some((value) => value?.toLowerCase().includes(normalizedQuery));

    const matchesCategory = matchesCategoryFilter(category, product)
      && (!subcategory || product.subcategory === subcategory);
    const matchesBrand = brandFilters.length === 0 || brandFilters.includes(product.brand);
    const matchesDelivery = deliveryFilters.length === 0 || deliveryFilters.includes(product.deliveryType);
    const matchesCard = cardFilters.length === 0 || cardFilters.includes(product.cardType);
    const matchesSeller = sellerFilters.length === 0 || sellerFilters.includes(product.seller);
    const matchesRating = ratingFilters.length === 0 || ratingFilters.some((rating) => Number(product.rating) >= Number(rating));

    return matchesSearch && matchesCategory && matchesBrand && matchesDelivery && matchesCard && matchesSeller && matchesRating;
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
  const [selectedSubcategory, setSelectedSubcategory] = useState("");
  const [openSubcategoryMenu, setOpenSubcategoryMenu] = useState(null);
  const [openNestedSubcategory, setOpenNestedSubcategory] = useState(null);
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

  const brandOptions = useMemo(() => {
    if (selectedCategory === "All" || selectedCategory === "Best Sellers") {
      return CATEGORY_BRANDS["All"];
    }

    return CATEGORY_BRANDS[selectedCategory] || [];
  }, [selectedCategory]);
  const deliveryTypeOptions = ["Free delivery", "Next day", "Standard"];
  const cardTypeOptions = ["Visa", "Mastercard", "Gift cards", "PayPal"];
  const sellerOptions = ["NorthPeak Living", "HomeStyle Living", "Peak & Co", "Aurelia Beauty", "Edgewell Studio"];

  const activeBrands = useMemo(
    () => selectedBrands.filter((brand) => brandOptions.includes(brand)),
    [selectedBrands, brandOptions]
  );

  const loadProducts = useCallback(async () => {
    const params = {
      search: searchTerm.trim() || undefined,
    };

    setIsLoading(true);

    await syncSellerListings();

    try {
      const response = await axios.get("/api/products", {
        params,
        timeout: 1500,
      });

      const payload = response.data || {};
      const backendProducts = Array.isArray(payload)
        ? payload
        : payload.products || [];
      const approvedSellerProducts = readApprovedSellerListings();
      const approvedIds = new Set(approvedSellerProducts.map((product) => product.id));
      const normalizedProducts = backendProducts
        .filter((product) => !approvedIds.has(product.id))
        .map(normalizeBackendProduct);

      const fallbackSource = normalizedProducts.length > 0
        ? [...approvedSellerProducts, ...normalizedProducts]
        : [...approvedSellerProducts, ...buildSampleProducts()];
      const filteredProducts = fallbackSource.filter((product) => getSampleProductMatch(
        product,
        searchTerm,
        selectedCategory,
        activeBrands,
        selectedDeliveryTypes,
        selectedCardTypes,
        selectedSellers,
        selectedRatings,
        selectedSubcategory
      ));

      const sortedProducts = sortProducts(
        filteredProducts,
        sortBy
      );

      setProducts(sortedProducts);
      setTotalResults(sortedProducts.length);
      setTotalPages(Math.max(1, Math.ceil(sortedProducts.length / PAGE_SIZE)));
    } catch {
      const approvedSellerProducts = readApprovedSellerListings();
      const fallbackProducts = sortProducts(
        [...approvedSellerProducts, ...buildSampleProducts()].filter((product) => getSampleProductMatch(
          product,
          searchTerm,
          selectedCategory,
          activeBrands,
          selectedDeliveryTypes,
          selectedCardTypes,
          selectedSellers,
          selectedRatings,
          selectedSubcategory
        )),
        sortBy
      );
      setProducts(fallbackProducts);
      setTotalResults(fallbackProducts.length);
      setTotalPages(Math.max(1, Math.ceil(fallbackProducts.length / PAGE_SIZE)));
    } finally {
      setIsLoading(false);
    }
  }, [searchTerm, activeBrands, selectedCardTypes, selectedCategory, selectedDeliveryTypes, selectedRatings, selectedSellers, selectedSubcategory, sortBy]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadProducts();
  }, [loadProducts]);

  const safePage = Math.min(page, totalPages);
  const pageProducts = products.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);
  const resultStart = totalResults === 0 ? 0 : (safePage - 1) * PAGE_SIZE + 1;
  const resultEnd = Math.min(safePage * PAGE_SIZE, totalResults);

  const filterKey = JSON.stringify([searchTerm, selectedCategory, selectedSubcategory, activeBrands, selectedDeliveryTypes, selectedCardTypes, selectedRatings, selectedSellers]);
  const [lastFilterKey, setLastFilterKey] = useState(filterKey);
  if (lastFilterKey !== filterKey) {
    setLastFilterKey(filterKey);
    setPage(1);
  }

  const handleOpenProduct = (productId) => {
    navigate(`/products/${productId}`);
  };

  const handleAddToCart = async (productId) => {
    try {
      await addToCart(productId, 1);
      handleOpenProduct(productId);
    } catch (error) {
      console.error("Error adding product to cart:", error);
      handleOpenProduct(productId);
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
              <select value={selectedCategory} onChange={(event) => { setSelectedCategory(event.target.value); setSelectedSubcategory(""); }}>
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

        <nav className="secondary-nav" aria-label="Product categories">
          {CATEGORY_LINKS.map((category) => {
            const subcategories = SUBCATEGORIES_BY_CATEGORY[category] || [];
            const nestedSubcategories = NESTED_SUBCATEGORIES_BY_CATEGORY[category] || {};

            return (
              <div key={category} className="category-menu-item">
                <button
                  type="button"
                  className={selectedCategory === category ? "secondary-link active" : "secondary-link"}
                  onClick={() => {
                    setSelectedCategory(category);
                    setSelectedSubcategory("");
                    setOpenNestedSubcategory(null);
                    setOpenSubcategoryMenu(category);
                  }}
                >
                  {category}
                </button>
                {openSubcategoryMenu === category && subcategories.length > 0 ? (
                  <div className="secondary-nav subcategory-nav">
                    {["All", ...subcategories].map((subcategory) => {
                      const value = subcategory === "All" ? "" : subcategory;
                      const nestedOptions = nestedSubcategories[subcategory] || [];

                      if (nestedOptions.length > 0) {
                        return (
                          <div key={subcategory} className="nested-category-option">
                            <button
                              type="button"
                              className="secondary-link"
                              aria-haspopup="true"
                              aria-expanded={openNestedSubcategory === subcategory}
                              onClick={() => setOpenNestedSubcategory(
                                openNestedSubcategory === subcategory ? null : subcategory
                              )}
                            >
                              {subcategory}
                            </button>
                            {openNestedSubcategory === subcategory ? (
                              <div className="secondary-nav nested-subcategory-nav">
                                {nestedOptions.map((nestedOption) => {
                                  const nestedValue = `${subcategory} - ${nestedOption}`;

                                  return (
                                    <button
                                      key={nestedOption}
                                      type="button"
                                      className={selectedSubcategory === nestedValue ? "secondary-link active" : "secondary-link"}
                                      onClick={() => {
                                        setSelectedSubcategory(nestedValue);
                                        setOpenNestedSubcategory(null);
                                        setOpenSubcategoryMenu(null);
                                      }}
                                    >
                                      {nestedOption}
                                    </button>
                                  );
                                })}
                              </div>
                            ) : null}
                          </div>
                        );
                      }

                      return (
                        <button
                          key={subcategory}
                          type="button"
                          className={selectedSubcategory === value ? "secondary-link active" : "secondary-link"}
                          onClick={() => {
                            setSelectedSubcategory(value);
                            setOpenSubcategoryMenu(null);
                          }}
                        >
                          {subcategory}
                        </button>
                      );
                    })}
                  </div>
                ) : null}
              </div>
            );
          })}
        </nav>
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
            {brandOptions.length === 0 ? (
              <p className="empty-results">No brands available for this category.</p>
            ) : (
              brandOptions.map((option) => (
                <label key={option} className="check-row">
                  <input
                    type="checkbox"
                    aria-label={option}
                    checked={activeBrands.includes(option)}
                                        onChange={() => toggleSelection(option, activeBrands, setSelectedBrands)}
                  />
                  <span>{option}</span>
                </label>
              ))
            )}
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
                    <Link to={`/products/${product.id}`} aria-label={`View details for ${product.title}`}>
                      <img src={product.image} alt={product.title} />
                    </Link>
                  </div>

                  <div className="product-card-body">
                    <h4>
                      <Link to={`/products/${product.id}`} onClick={(event) => event.stopPropagation()} style={{ color: "inherit", textDecoration: "none" }}>
                        {product.title}
                      </Link>
                    </h4>
                    <p className="product-subtitle">{product.subtitle}</p>
                    <p className="product-subtitle">Origin: {product.originLocation || "Not specified"}</p>

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

                    <button
                      type="button"
                      className="add-to-cart-button"
                      onClick={() => handleAddToCart(product.id)}
                    >
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
