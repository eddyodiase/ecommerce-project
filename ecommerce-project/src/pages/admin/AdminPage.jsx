import axios from "axios";
import { useEffect, useState } from "react";

import { Header } from "../../components/Header";
import { AdminOrdersPanel } from "./AdminOrdersPanel";
import { updateSellerListingStatus } from "../../utils/sellerListings";
import "./AdminPage.css";

export function AdminPage() {
  const [listings, setListings] = useState([]);
  const [adminKey, setAdminKey] = useState(() => sessionStorage.getItem("adminApiKey") || "");
  const [activeAdminKey, setActiveAdminKey] = useState(() => sessionStorage.getItem("adminApiKey") || "");
  const [isLoading, setIsLoading] = useState(() => Boolean(sessionStorage.getItem("adminApiKey")));
  const [error, setError] = useState("");

  const loadListings = async (key = activeAdminKey) => {
    if (!key) return;
    try {
      setError("");
      setIsLoading(true);
      const response = await axios.get("/api/listings", {
        headers: { "x-admin-key": key },
      });
      const pendingListings = Array.isArray(response.data)
        ? response.data.filter((listing) => listing.status === "pending")
        : [];
      setListings(pendingListings);
    } catch {
      setError("We could not load pending listings.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!activeAdminKey) return undefined;

    let isCurrent = true;
    axios
      .get("/api/listings", {
        headers: { "x-admin-key": activeAdminKey },
      })
      .then((response) => {
        if (!isCurrent) return;
        const pendingListings = Array.isArray(response.data)
          ? response.data.filter((listing) => listing.status === "pending")
          : [];
        setListings(pendingListings);
      })
      .catch(() => {
        if (isCurrent) {
          setError("We could not load pending listings.");
        }
      })
      .finally(() => {
        if (isCurrent) {
          setIsLoading(false);
        }
      });

    return () => {
      isCurrent = false;
    };
  }, [activeAdminKey]);

  const handleDecision = async (listingId, status) => {
    try {
      await updateSellerListingStatus(listingId, status, activeAdminKey);
      await loadListings();
    } catch {
      setError("We could not update that listing.");
    }
  };

  return (
    <>
      <Header />
      <div className="admin-page">
      <header className="admin-page-header">
        <div>
          <p className="admin-eyebrow">Admin dashboard</p>
          <h1>Pending seller listings</h1>
        </div>
      </header>

      <main className="admin-page-shell">
        <form
          className="admin-key-form"
          onSubmit={(event) => {
            event.preventDefault();
            const key = adminKey.trim();
            sessionStorage.setItem("adminApiKey", key);
            setActiveAdminKey(key);
            void loadListings(key);
          }}
        >
          <label htmlFor="admin-api-key">Admin key</label>
          <input
            id="admin-api-key"
            type="password"
            autoComplete="current-password"
            value={adminKey}
            onChange={(event) => setAdminKey(event.target.value)}
          />
          <button type="submit">Load admin data</button>
        </form>
        {error ? <div className="admin-error">{error}</div> : null}

        {isLoading ? (
          <div className="admin-empty">Loading pending listings...</div>
        ) : !activeAdminKey ? (
          <div className="admin-empty">Enter the server admin key to review listings and orders.</div>
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
                  {listing.category}{listing.subcategory ? ` › ${listing.subcategory}` : ""} · {listing.sellerName}
                </p>
                <p className="listing-meta">
                  Origin: {listing.originLocation || "Not specified"}
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
      <AdminOrdersPanel adminKey={activeAdminKey} />
      </div>
    </>
  );
}
