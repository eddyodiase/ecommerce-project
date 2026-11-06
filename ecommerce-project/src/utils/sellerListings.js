import axios from "axios";
import { classifyHomeProduct } from "./homeCatalog";

export const SELLER_LISTINGS_STORAGE_KEY = "sellerListings";

const isListing = (entry) => Boolean(entry && typeof entry.id === "string" && entry.productName && entry.status);

const readLocal = () => {
  try {
    const parsed = JSON.parse(localStorage.getItem(SELLER_LISTINGS_STORAGE_KEY) || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const hasPhotos = (listing) => (
  (Array.isArray(listing.imageDataUrls) && listing.imageDataUrls.length > 0) || Boolean(listing.imageDataUrl)
);

const stripImages = (listing) => {
  const rest = { ...listing };
  delete rest.imageDataUrls;
  delete rest.imageDataUrl;
  return rest;
};

// Photos are base64 and quickly exceed the localStorage quota, so the cache falls back to
// metadata only. The backend keeps the photos and sync restores them.
const writeLocal = (listings) => {
  try {
    localStorage.setItem(SELLER_LISTINGS_STORAGE_KEY, JSON.stringify(listings));
  } catch {
    try {
      localStorage.setItem(SELLER_LISTINGS_STORAGE_KEY, JSON.stringify(listings.map(stripImages)));
    } catch {
      // Cache unavailable; the backend remains the source of truth.
    }
  }
};

// The backend is the source of truth; localStorage is only a cache for sync readers.
export async function syncSellerListings() {
  try {
    const response = await axios.get("/api/listings", { timeout: 3000 });
    if (!Array.isArray(response.data)) {
      return;
    }

    const remote = response.data.filter(isListing);
    const remoteIds = new Set(remote.map((listing) => listing.id));
    const localOnly = readLocal().filter((listing) => isListing(listing) && !remoteIds.has(listing.id));

    // Photo-less cached copies would create listings that can never be published.
    await Promise.allSettled(localOnly.filter(hasPhotos).map((listing) => axios.post("/api/listings", listing)));

    writeLocal([...localOnly, ...remote]);
  } catch {
    // Backend unavailable: keep using the cached listings.
  }
}

export async function submitSellerListing(listing) {
  try {
    await axios.post("/api/listings", listing);
  } catch (error) {
    // A rejected listing (4xx) or one whose photos cannot be cached would be lost, so report it.
    if (error?.response && error.response.status < 500) {
      throw error;
    }
    try {
      localStorage.setItem(SELLER_LISTINGS_STORAGE_KEY, JSON.stringify([listing, ...readLocal()]));
    } catch {
      throw error;
    }
    return;
  }
  writeLocal([listing, ...readLocal()]);
}

// Returns the logged-in seller's email, or "" when nobody is logged in.
export function getLoggedInSellerEmail() {
  try {
    if (!localStorage.getItem("authToken")) {
      return "";
    }
    const user = JSON.parse(localStorage.getItem("authUser") || "null");
    return String(user?.email || "").trim().toLowerCase();
  } catch {
    return "";
  }
}

export const canDeleteListing = (ownerEmail) => {
  const sellerEmail = getLoggedInSellerEmail();
  return Boolean(sellerEmail) && sellerEmail === String(ownerEmail || "").trim().toLowerCase();
};

// Deletes a product the logged-in seller owns. Throws when not allowed or the backend refuses.
export async function deleteSellerListing(listingId, ownerEmail) {
  const sellerEmail = getLoggedInSellerEmail();
  const authToken = localStorage.getItem("authToken");
  const cached = readLocal().find((listing) => listing.id === listingId);
  if (!authToken || !sellerEmail || !canDeleteListing(ownerEmail ?? cached?.ownerEmail)) {
    throw new Error("not-allowed");
  }

  try {
    await axios.delete(`/api/listings/${encodeURIComponent(listingId)}`, {
      headers: {
        Authorization: `Bearer ${authToken}`,
        "x-seller-email": sellerEmail,
      },
    });
  } catch (error) {
    // A 404 means the backend never had it (local-only listing), so local removal is still correct.
    if (error.response?.status !== 404) {
      throw error;
    }
  }

  writeLocal(readLocal().filter((listing) => listing.id !== listingId));
}

export const getCachedListing = (listingId) => readLocal().find((listing) => listing.id === listingId);

export async function getEditableSellerListing(listingId) {
  await syncSellerListings();
  const cached = getCachedListing(listingId);
  if (cached) {
    return cached;
  }

  const response = await axios.get("/api/products", { timeout: 5000 });
  const product = (Array.isArray(response.data) ? response.data : [])
    .find((entry) => entry?.id === listingId);
  if (!product) {
    return null;
  }

  const details = product.details || {};
  const listing = {
    id: product.id,
    productName: product.name || "",
    category: details.category || classifyHomeProduct({ name: product.name, keywords: product.keywords }).category,
    subcategory: details.subcategory || "",
    price: Number(product.priceCents || 0) / 100,
    description: details.description || "",
    sellerName: details.sellerName || "",
    ownerEmail: product.ownerEmail || "",
    condition: details.condition || "",
    nafdacNo: details.nafdacNo || "",
    originLocation: details.originLocation || "",
    phoneSpecs: details.phoneSpecs || {},
    sizeStock: product.sizeStock || {},
    imageUrl: product.image || "",
    imageNames: product.image ? ["Current product image"] : [],
    status: "approved",
  };
  writeLocal([listing, ...readLocal()]);
  return listing;
}

// Updates a listing the logged-in seller owns. Throws when not allowed or the backend refuses.
export async function updateSellerListing(listingId, updates) {
  const sellerEmail = getLoggedInSellerEmail();
  const cached = getCachedListing(listingId);
  if (!sellerEmail || !cached || !canDeleteListing(cached.ownerEmail)) {
    throw new Error("not-allowed");
  }

  const next = { ...cached, ...updates, id: listingId, ownerEmail: cached.ownerEmail, status: "pending" };

  try {
    await axios.put(`/api/listings/${encodeURIComponent(listingId)}`, next, {
      headers: { "x-seller-email": sellerEmail },
    });
  } catch (error) {
    // A 404 means the backend never had it (local-only listing), so the local update is still correct.
    if (error.response?.status !== 404) {
      throw error;
    }
  }

  writeLocal(readLocal().map((listing) => (listing.id === listingId ? next : listing)));
  return next;
}

export async function updateSellerListingStatus(listingId, status) {
  await syncSellerListings();
  try {
    await axios.patch(`/api/listings/${encodeURIComponent(listingId)}`, { status });
  } catch (error) {
    // The backend refused (e.g. approving a listing without photos): don't pretend it worked.
    if (error?.response && error.response.status < 500) {
      throw error;
    }
  }
  writeLocal(readLocal().map((listing) => (listing.id === listingId ? { ...listing, status } : listing)));
}
