import axios from "axios";
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

import { useCart } from "../../context/CartContext";
import { syncSellerListings } from "../../utils/sellerListings";
import { buildSampleProducts } from "./ProductsSearchPage";

const SELLER_LISTINGS_STORAGE_KEY = "sellerListings";

const formatNaira = (value) =>
  new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));

const tabs = ["Description", "Manufacturer", "Reviews"];
const colorOptions = [
  { name: "Midnight Black", value: "#111827" },
  { name: "Pearl White", value: "#f3f4f6" },
  { name: "Ocean Blue", value: "#2563eb" },
  { name: "Rose Gold", value: "#d97706" },
];
const sizeOptions = ["64GB", "128GB", "256GB", "512GB"];
const defaultRamOptions = [4, 8, 12];

const slugify = (value) =>
  String(value || "")
    .trim()
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const normalizeImagePath = (image) => {
  if (!image || typeof image !== "string") {
    return image;
  }

  if (image.startsWith("/") || image.startsWith("http") || image.startsWith("data:") || image.startsWith("blob:")) {
    return image;
  }

  return `/${image.replace(/^\.?\//, "")}`;
};

const normalizeCategoryKey = (value) => String(value || "").trim().toLowerCase().replace(/[^a-z0-9]+/g, " ").replace(/\s+/g, " ").trim();

const normalizeProduct = (product = {}) => {
  const ratingValue = Number(product.rating?.stars || 0);
  const keywordList = Array.isArray(product.keywords) ? product.keywords : [product.keywords].filter(Boolean);

  return {
    id: product.id,
    title: product.name || "Product",
    subtitle: keywordList.slice(0, 3).join(" • ") || "Featured item",
    brand: product.brand || "NorthPeak",
    category: product.category || "Home",
    seller: product.seller || "NorthPeak Marketplace",
    deliveryType: product.deliveryType || "Standard",
    cardType: product.cardType || "Visa",
    price: Number(product.priceCents || product.price || 0),
    rating: ratingValue,
    reviewCount: Number(product.rating?.count || 0),
    image: normalizeImagePath(product.image),
    galleryImages: Array.isArray(product.galleryImages)
      ? product.galleryImages.map((image) => normalizeImagePath(image)).filter(Boolean)
      : [],
    badge: ratingValue >= 4.5 ? "Best Seller" : "",
    phoneSpecs: product.phoneSpecs,
    originLocation: product.originLocation || "Warehouse - NG",
  };
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
        const listingImages = Array.isArray(listing.imageDataUrls)
          ? listing.imageDataUrls
          : [listing.imageDataUrl || listing.imageUrl].filter(Boolean);
        const normalizedListingImages = listingImages.map((image) => normalizeImagePath(image)).filter(Boolean);

        return {
          id: listing.id,
          title: listing.productName || "Seller listing",
          subtitle: listing.description || "Seller listed product",
          brand: listing.phoneSpecs?.brand || listing.sellerName || "Marketplace Seller",
          category: listing.category || "Home",
          seller: listing.sellerName || "Marketplace Seller",
          originLocation: listing.originLocation || "Not specified",
          deliveryType: "Standard",
          cardType: "Visa",
          price: Number(listing.price || 0),
          rating: 4.5,
          reviewCount: 0,
          image: normalizedListingImages[0] || "/images/products/Itel%20P23%20Pro.jpg",
          galleryImages: normalizedListingImages,
          badge: "Seller Pick",
          phoneSpecs: listing.phoneSpecs,
        };
      });
  } catch (error) {
    return [];
  }
};

const resolveProduct = (allProducts, requestedId) => {
  const normalizedId = String(requestedId || "").trim();
  if (!normalizedId) {
    return undefined;
  }

  const requestedSlug = slugify(normalizedId);

  const exactMatch = allProducts.find((item) => item.id === normalizedId || slugify(item.id) === requestedSlug);
  if (exactMatch) {
    return exactMatch;
  }

  const shortId = normalizedId.replace(/-\d+$/, "");
  const shortSlug = slugify(shortId);
  const baseIdMatch = allProducts.find((item) => {
    const itemIdSlug = slugify(item.id);
    return item.id === shortId || itemIdSlug === shortSlug || itemIdSlug.startsWith(`${shortSlug}-`);
  });
  if (baseIdMatch) {
    return baseIdMatch;
  }

  return allProducts.find((item) => {
    const itemSlug = slugify(item.title);
    return itemSlug === requestedSlug || itemSlug.includes(requestedSlug) || slugify(item.id).includes(requestedSlug);
  });
};

export function ProductDetailPage() {
  const { productId } = useParams();
  const fallbackProducts = [...readApprovedSellerListings(), ...buildSampleProducts()];
  const [catalog, setCatalog] = useState(fallbackProducts);
  const [resolvedProduct, setResolvedProduct] = useState(() => resolveProduct(fallbackProducts, productId));
  const [isResolvingProduct, setIsResolvingProduct] = useState(true);
  const product = resolvedProduct;
  const { addToCart } = useCart();
  const [activeTab, setActiveTab] = useState("Description");
  const [quantity, setQuantity] = useState(1);
  const [selectedColor, setSelectedColor] = useState(colorOptions[0].name);
  const [selectedSize, setSelectedSize] = useState(sizeOptions[1]);
  const [selectedRam, setSelectedRam] = useState(defaultRamOptions[1]);
  const [selectedImage, setSelectedImage] = useState(product?.image || "");
  const [showAddedToast, setShowAddedToast] = useState(false);

  useEffect(() => {
    setIsResolvingProduct(true);
  }, [productId]);

  useEffect(() => {
    if (product) {
      setIsResolvingProduct(false);
    }
  }, [product]);

  useEffect(() => {
    const controller = new AbortController();

    const loadProduct = async () => {
      await syncSellerListings();
      try {
        const response = await axios.get("/api/products", {
          timeout: 1500,
          signal: controller.signal,
        });

        const payload = Array.isArray(response.data) ? response.data : response.data?.products || [];
        const normalizedProducts = payload.map(normalizeProduct);
        const approvedSellerProducts = readApprovedSellerListings();
        const nextCatalog = normalizedProducts.length > 0
          ? [...approvedSellerProducts, ...normalizedProducts]
          : fallbackProducts;
        setCatalog(nextCatalog);
        setResolvedProduct(resolveProduct(nextCatalog, productId) || resolveProduct(fallbackProducts, productId));
      } catch (error) {
        if (error.name === "CanceledError" || error.code === "ERR_CANCELED") {
          return;
        }

        setCatalog(fallbackProducts);
        setResolvedProduct(resolveProduct(fallbackProducts, productId));
      } finally {
        setIsResolvingProduct(false);
      }
    };

    void loadProduct();
    return () => controller.abort();
  }, [fallbackProducts, productId]);

  useEffect(() => {
    setSelectedImage(product?.image || "");
    const storageChoices = Array.isArray(product?.phoneSpecs?.storageOptionsGb) && product.phoneSpecs.storageOptionsGb.length > 0
      ? product.phoneSpecs.storageOptionsGb
      : sizeOptions.map((option) => Number(String(option).replace(/[^0-9]/g, ""))).filter((value) => Number.isFinite(value));
    const ramChoices = Array.isArray(product?.phoneSpecs?.ramOptionsGb) && product.phoneSpecs.ramOptionsGb.length > 0
      ? product.phoneSpecs.ramOptionsGb
      : defaultRamOptions;

    setSelectedSize(`${storageChoices[0] || 128}GB`);
    setSelectedRam(Number(ramChoices[0] || 8));
  }, [product?.id]);

  useEffect(() => {
    if (!showAddedToast) {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => {
      setShowAddedToast(false);
    }, 1800);

    return () => window.clearTimeout(timeoutId);
  }, [showAddedToast]);

  const handleAddToCart = async () => {
    if (!product) {
      return;
    }

    await addToCart(product.id, quantity);
    setShowAddedToast(true);
  };

  if (!product && isResolvingProduct) {
    return (
      <main style={{ padding: "2rem", maxWidth: "900px", margin: "0 auto" }}>
        <p>Loading product details...</p>
      </main>
    );
  }

  if (!product && !isResolvingProduct) {
    return (
      <main style={{ padding: "2rem", maxWidth: "900px", margin: "0 auto" }}>
        <Link to="/">← Back to products</Link>
        <h2 style={{ marginTop: "1rem" }}>Product not found</h2>
        <p>The product you requested is not available.</p>
      </main>
    );
  }

  const relatedProducts = catalog
    .filter((item) => item.category === product.category && item.id !== product.id)
    .slice(0, 4);

  const galleryImages = Array.from(
    new Set([
      product.image,
      ...(Array.isArray(product.galleryImages) ? product.galleryImages : []),
      ...(relatedProducts.slice(0, 3).map((item) => item.image)),
      product.image,
    ].filter(Boolean))
  ).slice(0, 4);

  const tabContent = {
    Description: (
      <div style={{ color: "#374151", lineHeight: 1.8 }}>
        <p>{product.subtitle}</p>
        <p>
          Designed for everyday performance and premium usability, this product combines modern design,
          dependable quality, and a customer-first experience. It brings together durable construction,
          reliable functionality, and an elegant finish that fits naturally into your home, lifestyle, or workspace.
        </p>
        <ul style={{ margin: "1rem 0 0", paddingLeft: "1.25rem" }}>
          <li>Premium build quality and finish</li>
          <li>Responsive, intuitive experience</li>
          <li>Reliable shipping and support</li>
          <li>Backed by trusted customer satisfaction</li>
        </ul>
      </div>
    ),
    Manufacturer: (
      <div style={{ color: "#374151", lineHeight: 1.8 }}>
        <p><strong>Brand:</strong> {product.brand}</p>
        <p><strong>Seller:</strong> {product.seller}</p>
        <p><strong>Category:</strong> {product.category}</p>
        <p><strong>Origin:</strong> {product.originLocation || "Not specified"}</p>
        <p><strong>Delivery:</strong> {product.deliveryType}</p>
        <p><strong>Payment:</strong> {product.cardType}</p>
      </div>
    ),
    Reviews: (
      <div style={{ color: "#374151", lineHeight: 1.8 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1.25rem", flexWrap: "wrap" }}>
          <div style={{ fontSize: "2.2rem", fontWeight: 800, lineHeight: 1 }}>{product.rating}</div>
          <div>
            <div style={{ color: "#f59e0b", letterSpacing: "0.12em" }}>★★★★★</div>
            <div>{product.reviewCount} verified reviews</div>
          </div>
        </div>

        <div style={{ display: "grid", gap: "0.7rem", marginBottom: "1.25rem" }}>
          {[5, 4, 3, 2, 1].map((score) => {
            const value = score === 5 ? 70 : score === 4 ? 18 : score === 3 ? 8 : score === 2 ? 3 : 1;
            return (
              <div key={score} style={{ display: "grid", gridTemplateColumns: "40px 1fr 40px", alignItems: "center", gap: "0.75rem" }}>
                <span>{score}★</span>
                <div style={{ height: "10px", background: "#e5e7eb", borderRadius: "999px", overflow: "hidden" }}>
                  <div style={{ width: `${value}%`, height: "100%", background: "#111827", borderRadius: "999px" }} />
                </div>
                <span style={{ textAlign: "right", color: "#6b7280" }}>{value}%</span>
              </div>
            );
          })}
        </div>

        <div style={{ marginTop: "1rem", padding: "0.9rem 1rem", background: "#f9fafb", borderRadius: "12px" }}>
          “Excellent build quality and easy ordering process. Delivery was fast and the product looks even better in person.”
        </div>
      </div>
    ),
  };

  const isSmartPhoneProduct = normalizeCategoryKey(product.category) === "smart phones";
  const phoneStorageOptions = isSmartPhoneProduct
    ? (Array.isArray(product.phoneSpecs?.storageOptionsGb) && product.phoneSpecs.storageOptionsGb.length > 0
      ? product.phoneSpecs.storageOptionsGb
      : sizeOptions.map((option) => Number(String(option).replace(/[^0-9]/g, ""))).filter((value) => Number.isFinite(value)))
    : [];
  const phoneRamOptions = isSmartPhoneProduct
    ? (Array.isArray(product.phoneSpecs?.ramOptionsGb) && product.phoneSpecs.ramOptionsGb.length > 0
      ? product.phoneSpecs.ramOptionsGb
      : defaultRamOptions)
    : [];

  return (
    <main style={{ maxWidth: "1280px", margin: "0 auto", padding: "2rem 1.5rem 4rem" }}>
      <Link to="/" style={{ display: "inline-block", marginBottom: "1.5rem", color: "#111827", textDecoration: "none", fontWeight: 600 }}>
        ← Back to products
      </Link>

      <section style={{ display: "grid", gridTemplateColumns: "minmax(440px, 1.4fr) minmax(300px, 0.8fr)", gap: "2rem", alignItems: "start" }}>
        <div style={{ display: "grid", gap: "1rem" }}>
          <div style={{ border: "1px solid #e5e7eb", borderRadius: "22px", background: "#fff", padding: "1.25rem", boxShadow: "0 12px 32px rgba(15, 23, 42, 0.05)" }}>
            <img
              src={selectedImage || product.image}
              alt={product.title}
              style={{ width: "100%", height: "620px", objectFit: "cover", borderRadius: "16px", display: "block" }}
            />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(90px, 1fr))", gap: "0.75rem" }}>
            {galleryImages.map((image, index) => (
              <button
                key={`${product.id}-thumb-${index}`}
                type="button"
                onClick={() => setSelectedImage(image)}
                style={{
                  border: selectedImage === image ? "2px solid #111827" : "1px solid #e5e7eb",
                  borderRadius: "14px",
                  background: "#fff",
                  padding: "0.45rem",
                  cursor: "pointer",
                  overflow: "hidden",
                }}
              >
                <img src={image} alt={`${product.title} preview ${index + 1}`} style={{ width: "100%", height: "92px", objectFit: "cover", borderRadius: "10px", display: "block" }} />
              </button>
            ))}
          </div>
        </div>

        <aside style={{ position: "sticky", top: "1.5rem", border: "1px solid #e5e7eb", borderRadius: "22px", background: "#fff", boxShadow: "0 18px 36px rgba(15, 23, 42, 0.08)", padding: "1.5rem" }}>
          <p style={{ margin: 0, color: "#0f766e", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", fontSize: "0.72rem" }}>
            {product.category}
          </p>
          <h1 style={{ margin: "0.65rem 0 0.8rem", fontSize: "2.2rem", lineHeight: 1.1 }}>{product.title}</h1>

          <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "1rem" }}>
            <span style={{ color: "#f59e0b", fontSize: "1.2rem" }}>★</span>
            <strong>{product.rating}</strong>
            <span style={{ color: "#6b7280" }}>({product.reviewCount} reviews)</span>
          </div>

          <div style={{ marginBottom: "1rem" }}>
            <div style={{ fontSize: "2.1rem", fontWeight: 800 }}>{formatNaira(product.price)}</div>
            <div style={{ color: "#4b5563", marginTop: "0.35rem" }}>{product.deliveryType} • Free returns</div>
          </div>

          <div style={{ marginBottom: "1.25rem" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.6rem" }}>
              <strong>Color</strong>
              <span style={{ color: "#6b7280" }}>{selectedColor}</span>
            </div>
            <div style={{ display: "flex", gap: "0.7rem", flexWrap: "wrap" }}>
              {colorOptions.map((color) => (
                <button
                  key={color.name}
                  type="button"
                  onClick={() => setSelectedColor(color.name)}
                  title={color.name}
                  aria-label={color.name}
                  style={{
                    width: "38px",
                    height: "38px",
                    borderRadius: "50%",
                    border: selectedColor === color.name ? "2px solid #111827" : "1px solid #d1d5db",
                    background: color.value,
                    boxShadow: selectedColor === color.name ? "0 0 0 3px rgba(17, 24, 39, 0.08)" : "none",
                    cursor: "pointer",
                    padding: 0,
                  }}
                />
              ))}
            </div>
          </div>

          {isSmartPhoneProduct ? (
            <>
              <div style={{ marginBottom: "1.25rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.6rem" }}>
                  <strong>Storage size</strong>
                  <span style={{ color: "#6b7280" }}>{selectedSize}</span>
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "0.6rem" }}>
                  {phoneStorageOptions.map((sizeValue) => {
                    const label = `${sizeValue}GB`;
                    return (
                      <button
                        key={label}
                        type="button"
                        onClick={() => setSelectedSize(label)}
                        style={{
                          padding: "0.65rem 0.9rem",
                          borderRadius: "10px",
                          border: selectedSize === label ? "1px solid #111827" : "1px solid #d1d5db",
                          background: selectedSize === label ? "#111827" : "#fff",
                          color: selectedSize === label ? "#fff" : "#111827",
                          fontWeight: 700,
                          cursor: "pointer",
                        }}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div style={{ marginBottom: "1.25rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.6rem" }}>
                  <strong>RAM</strong>
                  <span style={{ color: "#6b7280" }}>{selectedRam}GB</span>
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "0.6rem" }}>
                  {phoneRamOptions.map((ramValue) => (
                    <button
                      key={`${ramValue}-gb`}
                      type="button"
                      onClick={() => setSelectedRam(Number(ramValue))}
                      style={{
                        padding: "0.65rem 0.9rem",
                        borderRadius: "10px",
                        border: selectedRam === Number(ramValue) ? "1px solid #111827" : "1px solid #d1d5db",
                        background: selectedRam === Number(ramValue) ? "#111827" : "#fff",
                        color: selectedRam === Number(ramValue) ? "#fff" : "#111827",
                        fontWeight: 700,
                        cursor: "pointer",
                      }}
                    >
                      {ramValue}GB
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ marginBottom: "1.25rem", border: "1px solid #e5e7eb", borderRadius: "12px", background: "#f8fafc", padding: "0.85rem 1rem" }}>
                <div style={{ fontWeight: 800, marginBottom: "0.45rem" }}>Phone specifications</div>
                <div style={{ display: "grid", gap: "0.35rem", color: "#374151" }}>
                  <div><strong>Name:</strong> {product.title}</div>
                  <div><strong>Brand:</strong> {product.phoneSpecs?.brand || product.brand}</div>
                  <div><strong>OS:</strong> {product.phoneSpecs?.os || "Android"}</div>
                  {product.phoneSpecs?.batteryMah ? <div><strong>Battery:</strong> {product.phoneSpecs.batteryMah}mAh</div> : null}
                  {product.phoneSpecs?.cameraMp ? <div><strong>Camera:</strong> {product.phoneSpecs.cameraMp}MP</div> : null}
                </div>
              </div>
            </>
          ) : null}

          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1.25rem" }}>
            <span style={{ fontWeight: 600 }}>Quantity</span>
            <div style={{ display: "inline-flex", border: "1px solid #d1d5db", borderRadius: "10px", overflow: "hidden" }}>
              <button type="button" onClick={() => setQuantity((value) => Math.max(1, value - 1))} style={{ width: "38px", height: "38px", border: "none", background: "#f3f4f6", cursor: "pointer", fontSize: "1.2rem" }}>−</button>
              <span style={{ width: "42px", display: "inline-flex", alignItems: "center", justifyContent: "center", fontWeight: 700 }}>{quantity}</span>
              <button type="button" onClick={() => setQuantity((value) => value + 1)} style={{ width: "38px", height: "38px", border: "none", background: "#f3f4f6", cursor: "pointer", fontSize: "1.2rem" }}>+</button>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.65rem", marginBottom: "1.25rem" }}>
            <button
              type="button"
              onClick={handleAddToCart}
              style={{ background: "#111827", color: "#fff", border: "none", borderRadius: "12px", padding: "0.9rem 1rem", fontWeight: 700, cursor: "pointer" }}
            >
              Add to cart
            </button>
            <button type="button" style={{ background: "#f3f4f6", color: "#111827", border: "none", borderRadius: "12px", padding: "0.9rem 1rem", fontWeight: 700, cursor: "pointer" }}>
              Buy now
            </button>
          </div>

          <div style={{ marginTop: "1.2rem", padding: "0.9rem 1rem", borderRadius: "12px", background: "#f8fafc", border: "1px solid #e5e7eb" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.3rem" }}>
              <strong>Delivery estimate</strong>
              <span style={{ color: "#0f766e", fontWeight: 700 }}>Tomorrow</span>
            </div>
            <div style={{ color: "#4b5563" }}>Arrives by 7:00 PM for orders placed before 4:00 PM.</div>
          </div>

          <div style={{ display: "grid", gap: "0.7rem", marginTop: "1.2rem" }}>
            {[
              "Secure checkout",
              "Free delivery on eligible orders",
              "30-day returns",
              "Quality checked before dispatch",
            ].map((badge) => (
              <div key={badge} style={{ display: "flex", alignItems: "center", gap: "0.7rem", color: "#374151", fontWeight: 600 }}>
                <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: "22px", height: "22px", borderRadius: "50%", background: "#dcfce7", color: "#166534", fontSize: "0.85rem" }}>✓</span>
                {badge}
              </div>
            ))}
          </div>
        </aside>
      </section>

      <section style={{ marginTop: "2.5rem", border: "1px solid #e5e7eb", borderRadius: "20px", background: "#fff", overflow: "hidden" }}>
        <div style={{ display: "flex", gap: "0.75rem", borderBottom: "1px solid #e5e7eb", padding: "0.85rem 1.1rem 0" }}>
          {tabs.map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              style={{
                border: "none",
                background: activeTab === tab ? "#111827" : "transparent",
                color: activeTab === tab ? "#fff" : "#374151",
                borderRadius: "10px 10px 0 0",
                padding: "0.8rem 1rem",
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              {tab}
            </button>
          ))}
        </div>

        <div style={{ padding: "1.5rem" }}>{tabContent[activeTab]}</div>
      </section>

      <section style={{ marginTop: "2.5rem", border: "1px solid #e5e7eb", borderRadius: "20px", background: "#fff", padding: "1.5rem" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "1rem", marginBottom: "1.25rem", flexWrap: "wrap" }}>
          <h2 style={{ margin: 0 }}>Write a review</h2>
          <div style={{ color: "#f59e0b", letterSpacing: "0.14em" }}>★★★★★</div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) minmax(240px, 300px)", gap: "1.25rem" }}>
          <div style={{ display: "grid", gap: "0.9rem" }}>
            <div>
              <label style={{ display: "block", fontWeight: 700, marginBottom: "0.45rem" }}>Your review</label>
              <textarea
                rows="5"
                placeholder="Share details about the product quality, performance, and delivery experience..."
                style={{ width: "100%", resize: "vertical", border: "1px solid #d1d5db", borderRadius: "12px", padding: "0.85rem 1rem", font: "inherit" }}
              />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: "0.9rem" }}>
              <div>
                <label style={{ display: "block", fontWeight: 700, marginBottom: "0.45rem" }}>Name</label>
                <input type="text" placeholder="Aisha M." style={{ width: "100%", border: "1px solid #d1d5db", borderRadius: "12px", padding: "0.8rem 0.9rem", font: "inherit" }} />
              </div>
              <div>
                <label style={{ display: "block", fontWeight: 700, marginBottom: "0.45rem" }}>Rating</label>
                <select style={{ width: "100%", border: "1px solid #d1d5db", borderRadius: "12px", padding: "0.8rem 0.9rem", font: "inherit" }}>
                  <option>5 stars</option>
                  <option>4 stars</option>
                  <option>3 stars</option>
                  <option>2 stars</option>
                  <option>1 star</option>
                </select>
              </div>
            </div>
          </div>

          <div style={{ display: "grid", gap: "0.8rem", alignContent: "start", border: "1px solid #e5e7eb", borderRadius: "16px", background: "#f9fafb", padding: "1rem" }}>
            <div style={{ fontWeight: 800, fontSize: "1.1rem" }}>Review snapshot</div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span>Overall rating</span>
              <strong>{product.rating}/5</strong>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span>Verified buyers</span>
              <strong>{product.reviewCount}</strong>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span>Delivery</span>
              <strong>Fast</strong>
            </div>
            <button type="button" style={{ marginTop: "0.4rem", background: "#111827", color: "#fff", border: "none", borderRadius: "12px", padding: "0.8rem 1rem", fontWeight: 700, cursor: "pointer" }}>
              Submit review
            </button>
          </div>
        </div>
      </section>

      {relatedProducts.length > 0 ? (
        <section style={{ marginTop: "2.75rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
            <h2 style={{ margin: 0 }}>Related items</h2>
            <span style={{ color: "#6b7280" }}>Curated for you</span>
          </div>

          <div style={{ display: "flex", gap: "1rem", overflowX: "auto", paddingBottom: "0.5rem", scrollbarWidth: "thin" }}>
            {relatedProducts.map((relatedProduct) => (
              <Link
                key={relatedProduct.id}
                to={`/products/${relatedProduct.id}`}
                style={{
                  minWidth: "240px",
                  width: "240px",
                  textDecoration: "none",
                  color: "inherit",
                  border: "1px solid #e5e7eb",
                  borderRadius: "18px",
                  background: "#fff",
                  overflow: "hidden",
                  boxShadow: "0 10px 20px rgba(15, 23, 42, 0.04)",
                }}
              >
                <img src={relatedProduct.image} alt={relatedProduct.title} style={{ width: "100%", height: "200px", objectFit: "cover", display: "block" }} />
                <div style={{ padding: "1rem" }}>
                  <div style={{ fontWeight: 700, marginBottom: "0.35rem" }}>{relatedProduct.title}</div>
                  <div style={{ color: "#4b5563", marginBottom: "0.7rem" }}>{relatedProduct.subtitle}</div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontWeight: 800 }}>{formatNaira(relatedProduct.price)}</span>
                    <span style={{ color: "#f59e0b" }}>★ {relatedProduct.rating}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      <style>{`
        @media (max-width: 767px) {
          .mobile-purchase-bar {
            position: fixed;
            left: 0;
            right: 0;
            bottom: 0;
            z-index: 50;
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 0.75rem;
            padding: 0.8rem 1rem 1rem;
            background: rgba(255, 255, 255, 0.98);
            border-top: 1px solid #e5e7eb;
            box-shadow: 0 -8px 24px rgba(15, 23, 42, 0.08);
          }

          .mobile-purchase-bar-price {
            font-size: 1.1rem;
            font-weight: 800;
          }

          .mobile-purchase-bar-button {
            flex: 1;
            background: #111827;
            color: #fff;
            border: none;
            border-radius: 12px;
            padding: 0.9rem 1rem;
            font-weight: 700;
            cursor: pointer;
          }
        }

        @media (min-width: 768px) {
          .mobile-purchase-bar {
            display: none !important;
          }
        }
      `}</style>

      {showAddedToast ? (
        <div style={{
          position: "fixed",
          right: "1rem",
          bottom: "1rem",
          zIndex: 60,
          background: "#111827",
          color: "#fff",
          borderRadius: "12px",
          padding: "0.8rem 1rem",
          boxShadow: "0 16px 30px rgba(15, 23, 42, 0.2)",
          fontWeight: 700,
        }}>
          Added to cart
        </div>
      ) : null}

      <div className="mobile-purchase-bar">
        <div>
          <div style={{ color: "#6b7280", fontSize: "0.72rem", textTransform: "uppercase", letterSpacing: "0.08em" }}>From</div>
          <div className="mobile-purchase-bar-price">{formatNaira(product.price)}</div>
        </div>
        <button type="button" className="mobile-purchase-bar-button" onClick={handleAddToCart}>Add to cart</button>
      </div>
    </main>
  );
}
