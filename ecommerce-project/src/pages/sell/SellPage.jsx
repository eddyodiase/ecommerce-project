import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { PRODUCT_TAXONOMY } from "../products/ProductsSearchPage";
import "./SellPage.css";

const CATEGORIES = PRODUCT_TAXONOMY;
const SELLER_LISTINGS_STORAGE_KEY = "sellerListings";

const readSellerListings = () => {
  try {
    const parsed = JSON.parse(localStorage.getItem(SELLER_LISTINGS_STORAGE_KEY) || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    return [];
  }
};

export function SellPage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    productName: "",
    category: "Home",
    price: "",
    description: "",
    sellerName: "",
  });
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsSubmitting(true);
    setSubmitError("");

    try {
      const existingListings = readSellerListings();
      const nextListing = {
        id: `listing-${Date.now()}`,
        productName: formData.productName.trim(),
        category: formData.category,
        price: Number(formData.price),
        description: formData.description.trim(),
        sellerName: formData.sellerName.trim(),
        status: "pending",
        createdAt: new Date().toISOString(),
      };

      localStorage.setItem(
        SELLER_LISTINGS_STORAGE_KEY,
        JSON.stringify([nextListing, ...existingListings])
      );

      setIsSubmitted(true);
      window.setTimeout(() => {
        navigate("/products");
      }, 800);
    } catch (error) {
      setIsSubmitted(false);
      setSubmitError("We could not save your listing right now.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="sell-page">
      <header className="sell-page-header">
        <button type="button" className="back-link" onClick={() => navigate("/products")}>
          ← Back to products
        </button>
        <div>
          <p className="eyebrow">NorthPeak marketplace</p>
          <h1>Start selling on NorthPeak</h1>
        </div>
      </header>

      <main className="sell-page-shell">
        <section className="seller-card">
          <div className="seller-card-copy">
            <h2>List a product in minutes</h2>
            <p>
              Share your item details, set your price, and start reaching shoppers who already browse the NorthPeak store.
            </p>
          </div>

          <form className="sell-form" onSubmit={handleSubmit}>
            <label>
              Product name
              <input
                name="productName"
                type="text"
                value={formData.productName}
                onChange={handleChange}
                placeholder="Example: Coastal ceramic lamp"
                required
              />
            </label>

            <div className="field-row">
              <label>
                Category
                <select name="category" value={formData.category} onChange={handleChange}>
                  {CATEGORIES.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                Price
                <input
                  name="price"
                  type="number"
                  min="1"
                  step="100"
                  value={formData.price}
                  onChange={handleChange}
                  placeholder="25000"
                  required
                />
              </label>
            </div>

            <label>
              Seller name
              <input
                name="sellerName"
                type="text"
                value={formData.sellerName}
                onChange={handleChange}
                placeholder="Your business or brand name"
                required
              />
            </label>

            <label>
              Description
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Describe your product, materials, and shipping details"
                rows="5"
                required
              />
            </label>

            <div className="form-actions">
              <button type="submit" className="primary-sell-button" disabled={isSubmitting}>
                {isSubmitting ? "Saving..." : "Publish listing"}
              </button>
              <button type="button" className="secondary-sell-button" onClick={() => navigate("/products")}>
                Cancel
              </button>
            </div>

            {submitError ? (
              <div className="error-banner" role="alert">
                {submitError}
              </div>
            ) : null}

            {isSubmitted ? (
              <div className="success-banner" role="status">
                Your listing has been submitted for approval and will appear on the storefront after the review delay.
              </div>
            ) : null}
          </form>
        </section>
      </main>
    </div>
  );
}
