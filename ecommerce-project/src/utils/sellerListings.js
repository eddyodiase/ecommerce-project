import axios from "axios";

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

    await Promise.allSettled(localOnly.map((listing) => axios.post("/api/listings", listing)));

    localStorage.setItem(SELLER_LISTINGS_STORAGE_KEY, JSON.stringify([...localOnly, ...remote]));
  } catch {
    // Backend unavailable: keep using the cached listings.
  }
}

export async function submitSellerListing(listing) {
  try {
    await axios.post("/api/listings", listing);
  } catch {
    // Cached locally below; it is pushed to the backend on the next sync.
  }
  localStorage.setItem(SELLER_LISTINGS_STORAGE_KEY, JSON.stringify([listing, ...readLocal()]));
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
  const cached = readLocal().find((listing) => listing.id === listingId);
  if (!sellerEmail || !canDeleteListing(ownerEmail ?? cached?.ownerEmail)) {
    throw new Error("not-allowed");
  }

  try {
    await axios.delete(`/api/listings/${encodeURIComponent(listingId)}`, {
      headers: { "x-seller-email": sellerEmail },
    });
  } catch (error) {
    // A 404 means the backend never had it (local-only listing), so local removal is still correct.
    if (error.response?.status !== 404) {
      throw error;
    }
  }

  localStorage.setItem(
    SELLER_LISTINGS_STORAGE_KEY,
    JSON.stringify(readLocal().filter((listing) => listing.id !== listingId))
  );
}

export async function updateSellerListingStatus(listingId, status) {
  await syncSellerListings();
  try {
    await axios.patch(`/api/listings/${encodeURIComponent(listingId)}`, { status });
  } catch {
    // Fall through: the local cache is still updated.
  }
  localStorage.setItem(
    SELLER_LISTINGS_STORAGE_KEY,
    JSON.stringify(readLocal().map((listing) => (listing.id === listingId ? { ...listing, status } : listing)))
  );
}
