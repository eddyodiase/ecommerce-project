import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { PRODUCT_TAXONOMY, SUBCATEGORIES_BY_CATEGORY } from "../../utils/categories";
import { submitSellerListing } from "../../utils/sellerListings";
import "./SellPage.css";

const CATEGORIES = PRODUCT_TAXONOMY;
const MAX_PRODUCT_IMAGES = 10;

export function SellPage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    productName: "",
    category: "Home",
    subcategory: "",
    price: "",
    description: "",
    sellerName: "",
    originLocation: "",
    phoneBrand: "",
    ramOptionsGb: "",
    storageOptionsGb: "",
    os: "",
    batteryMah: "",
    cameraMp: "",
  });
  const [uploadedImages, setUploadedImages] = useState([]);
  const [draggedImageIndex, setDraggedImageIndex] = useState(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingImages, setIsUploadingImages] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((current) => ({
      ...current,
      [name]: value,
      ...(name === "category" ? { subcategory: "" } : {}),
    }));
  };

  const isSmartPhoneCategory = formData.category === "Smart Phones";

  const toNumericOptionList = (value) => String(value || "")
    .split(",")
    .map((entry) => Number(entry.trim()))
    .filter((entry) => Number.isFinite(entry) && entry > 0);

  const readFileAsDataUrl = (file) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      resolve({
        dataUrl: typeof reader.result === "string" ? reader.result : "",
        name: file.name,
      });
    };
    reader.onerror = () => reject(new Error("file-read-failed"));
    reader.readAsDataURL(file);
  });

  const handleImageUpload = async (event) => {
    const files = Array.from(event.target.files || []);
    event.target.value = "";
    if (files.length === 0) {
      return;
    }

    const remainingSlots = MAX_PRODUCT_IMAGES - uploadedImages.length;
    const selectedFiles = files.slice(0, Math.max(remainingSlots, 0));
    if (files.length > remainingSlots) {
      setSubmitError(`You can upload up to ${MAX_PRODUCT_IMAGES} photos per product.`);
    } else {
      setSubmitError("");
    }

    if (selectedFiles.length === 0) {
      return;
    }

    setIsUploadingImages(true);

    try {
      const imageEntries = await Promise.all(selectedFiles.map((file) => readFileAsDataUrl(file)));
      setUploadedImages((current) => [
        ...current,
        ...imageEntries.filter((entry) => entry.dataUrl),
      ].slice(0, MAX_PRODUCT_IMAGES));
    } catch {
      setSubmitError("We could not read one or more image files.");
    } finally {
      setIsUploadingImages(false);
    }
  };

  const handleRemoveImage = (index) => {
    setUploadedImages((current) => current.filter((_, imageIndex) => imageIndex !== index));
    setSubmitError("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (isUploadingImages) {
      setSubmitError("Please wait for image upload to complete.");
      return;
    }

    if (uploadedImages.length === 0) {
      setSubmitError("Please upload at least one product photo before publishing your listing.");
      return;
    }

    setIsSubmitting(true);
    setSubmitError("");

    try {
      const ramOptions = toNumericOptionList(formData.ramOptionsGb);
      const storageOptions = toNumericOptionList(formData.storageOptionsGb);
      const nextListing = {
        id: `listing-${Date.now()}`,
        productName: formData.productName.trim(),
        category: formData.category,
        subcategory: SUBCATEGORIES_BY_CATEGORY[formData.category] ? formData.subcategory : "",
        price: Number(formData.price),
        description: formData.description.trim(),
        sellerName: formData.sellerName.trim(),
        originLocation: formData.originLocation.trim(),
        imageDataUrls: uploadedImages.map((entry) => entry.dataUrl),
        imageNames: uploadedImages.map((entry) => entry.name),
        imageDataUrl: uploadedImages[0]?.dataUrl || "",
        imageName: uploadedImages[0]?.name || "",
        phoneSpecs: isSmartPhoneCategory
          ? {
            brand: formData.phoneBrand.trim(),
            ramOptionsGb: ramOptions,
            storageOptionsGb: storageOptions,
            os: formData.os.trim(),
            batteryMah: Number(formData.batteryMah) || undefined,
            cameraMp: Number(formData.cameraMp) || undefined,
          }
          : undefined,
        status: "pending",
        createdAt: new Date().toISOString(),
      };

      await submitSellerListing(nextListing);

      setIsSubmitted(true);
      window.setTimeout(() => {
        navigate("/products");
      }, 800);
    } catch {
      setIsSubmitted(false);
      setSubmitError("We could not save your listing right now.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleImageDragStart = (index) => {
    setDraggedImageIndex(index);
  };

  const handleImageDrop = (targetIndex) => {
    if (draggedImageIndex === null || draggedImageIndex === targetIndex) {
      setDraggedImageIndex(null);
      return;
    }

    setUploadedImages((currentImages) => {
      const nextImages = [...currentImages];
      const [draggedImage] = nextImages.splice(draggedImageIndex, 1);
      nextImages.splice(targetIndex, 0, draggedImage);
      return nextImages;
    });

    setDraggedImageIndex(null);
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

              {SUBCATEGORIES_BY_CATEGORY[formData.category] ? (
                <label>
                  Subcategory
                  <select name="subcategory" value={formData.subcategory} onChange={handleChange} required>
                    <option value="" disabled>Select a subcategory</option>
                    {SUBCATEGORIES_BY_CATEGORY[formData.category].map((subcategory) => (
                      <option key={subcategory} value={subcategory}>
                        {subcategory}
                      </option>
                    ))}
                  </select>
                </label>
              ) : null}

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
              Origin location
              <input
                name="originLocation"
                type="text"
                value={formData.originLocation}
                onChange={handleChange}
                placeholder="Example: Ikeja, Lagos"
                required
              />
            </label>

            <label>
              Product images (up to 10)
              <input
                name="imageFile"
                type="file"
                accept="image/*"
                multiple
                required={uploadedImages.length === 0}
                disabled={uploadedImages.length >= MAX_PRODUCT_IMAGES}
                onChange={handleImageUpload}
              />
            </label>
            <p className="upload-note">At least one product photo is required to publish a listing.</p>

            {uploadedImages.length > 0 ? (
              <p className="upload-note">Uploaded: {uploadedImages.length} photo(s)</p>
            ) : null}

            {uploadedImages.length > 1 ? (
              <p className="upload-note">Drag and drop photos to reorder. The first photo becomes the primary storefront image.</p>
            ) : null}

            {uploadedImages.length > 0 ? (
              <div className="uploaded-preview-grid">
                {uploadedImages.map((entry, index) => (
                  <figure
                    key={`${entry.name}-${index}`}
                    className={draggedImageIndex === index ? "uploaded-preview-item dragging" : "uploaded-preview-item"}
                    draggable
                    onDragStart={() => handleImageDragStart(index)}
                    onDragOver={(event) => event.preventDefault()}
                    onDrop={() => handleImageDrop(index)}
                    onDragEnd={() => setDraggedImageIndex(null)}
                  >
                    <img
                      src={entry.dataUrl}
                      alt={`Uploaded listing preview ${index + 1}`}
                      className="uploaded-preview"
                    />
                    <figcaption>{index === 0 ? `Primary • ${entry.name}` : entry.name}</figcaption>
                    <button
                      type="button"
                      className="secondary-sell-button remove-photo-button"
                      onClick={() => handleRemoveImage(index)}
                      aria-label={`Remove photo ${index + 1}`}
                    >
                      Remove
                    </button>
                  </figure>
                ))}
              </div>
            ) : null}

            {isSmartPhoneCategory ? (
              <div className="phone-specs-card">
                <h3>Smart phone specifications</h3>
                <p className="phone-specs-hint">Add full specs shoppers expect before buying.</p>

                <div className="field-row">
                  <label>
                    Brand
                    <input
                      name="phoneBrand"
                      type="text"
                      value={formData.phoneBrand}
                      onChange={handleChange}
                      placeholder="Example: vivo"
                      required={isSmartPhoneCategory}
                    />
                  </label>

                  <label>
                    Operating system
                    <input
                      name="os"
                      type="text"
                      value={formData.os}
                      onChange={handleChange}
                      placeholder="Example: Android 15"
                    />
                  </label>
                </div>

                <div className="field-row">
                  <label>
                    RAM options (GB, comma-separated)
                    <input
                      name="ramOptionsGb"
                      type="text"
                      value={formData.ramOptionsGb}
                      onChange={handleChange}
                      placeholder="4, 8, 12"
                      required={isSmartPhoneCategory}
                    />
                  </label>

                  <label>
                    Storage options (GB, comma-separated)
                    <input
                      name="storageOptionsGb"
                      type="text"
                      value={formData.storageOptionsGb}
                      onChange={handleChange}
                      placeholder="64, 128, 256"
                      required={isSmartPhoneCategory}
                    />
                  </label>
                </div>

                <div className="field-row">
                  <label>
                    Battery (mAh)
                    <input
                      name="batteryMah"
                      type="number"
                      min="1"
                      value={formData.batteryMah}
                      onChange={handleChange}
                      placeholder="5000"
                    />
                  </label>

                  <label>
                    Main camera (MP)
                    <input
                      name="cameraMp"
                      type="number"
                      min="1"
                      value={formData.cameraMp}
                      onChange={handleChange}
                      placeholder="50"
                    />
                  </label>
                </div>
              </div>
            ) : null}

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
              <button type="submit" className="primary-sell-button" disabled={isSubmitting || isUploadingImages}>
                {isUploadingImages ? "Uploading photos..." : isSubmitting ? "Saving..." : "Publish listing"}
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
