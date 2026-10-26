import { useEffect, useState } from "react";

import "./AdminPage.css";

const SELLER_LISTINGS_STORAGE_KEY = "sellerListings";

const readSellerListings = () => {
  try {
    const parsed = JSON.parse(localStorage.getItem(SELLER_LISTINGS_STORAGE_KEY) || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    return [];
  }
};

const saveSellerListings = (listings) => {
  localStorage.setItem(SELLER_LISTINGS_STORAGE_KEY, JSON.stringify(listings));
};

export function AdminPage() {
  const [listings, setListings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const loadListings = async () => {
    try {
      setError("");
      const allListings = readSellerListings();
      const pendingListings = Array.isArray(allListings)
        ? allListings.filter((listing) => listing.status === "pending")
        : [];

      setListings(pendingListings);
    } catch (fetchError) {
      setError("We could not load pending listings.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadListings();
  }, []);

  const handleDecision = async (listingId, status) => {
    try {
      const currentListings = readSellerListings();
      const nextListings = currentListings.map((listing) => (
        listing.id === listingId
          ? { ...listing, status }
          : listing
      ));
      saveSellerListings(nextListings);
      await loadListings();
    } catch (updateError) {
      setError("We could not update that listing.");
    }
  };

  return (
    <div className="admin-page">
      <header className="admin-page-header">
        <div>
          <p className="admin-eyebrow">Admin dashboard</p>
          <h1>Pending seller listings</h1>
        </div>
      </header>

      <main className="admin-page-shell">
        {error ? <div className="admin-error">{error}</div> : null}

        {isLoading ? (
          <div className="admin-empty">Loading pending listings...</div>
        ) : listings.length === 0 ? (
          <div className="admin-empty">No pending listings need review.</div>
        ) : (
          <div className="admin-listings">
            {listings.map((listing) => (
              <article key={listing.id} className="listing-card">
                <div className="listing-heading">
                  <div>
                    <p className="listing-status">Pending review</p>
                    <h2>{listing.productName}</h2>
                  </div>
                  <span className="listing-price">₦{Number(listing.price || 0).toLocaleString()}</span>
                </div>

                <p className="listing-meta">
                  {listing.category} · {listing.sellerName}
                </p>
                <p className="listing-description">{listing.description}</p>
                <p className="listing-date">
                  Submitted {new Date(listing.createdAt).toLocaleString()}
                </p>

                <div className="listing-actions">
                  <button
                    type="button"
                    className="approve-button"
                    onClick={() => handleDecision(listing.id, "approved")}
                  >
                    Approve
                  </button>
                  <button
                    type="button"
                    className="reject-button"
                    onClick={() => handleDecision(listing.id, "rejected")}
                  >
                    Reject
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
