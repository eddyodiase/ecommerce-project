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
