import axios from "axios";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { canDeleteListing, deleteSellerListing } from "./sellerListings";

vi.mock("axios");

const listing = { id: "listing-1", productName: "Lamp", status: "approved", ownerEmail: "seller@example.com" };

const logIn = (email) => {
  localStorage.setItem("authToken", "token");
  localStorage.setItem("authUser", JSON.stringify({ email }));
};

describe("seller listing deletion", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.resetAllMocks();
    localStorage.setItem("sellerListings", JSON.stringify([listing]));
  });

  it("only lets the logged-in owner delete a listing", () => {
    expect(canDeleteListing(listing.ownerEmail)).toBe(false);

    logIn("other@example.com");
    expect(canDeleteListing(listing.ownerEmail)).toBe(false);

    logIn("Seller@Example.com");
    expect(canDeleteListing(listing.ownerEmail)).toBe(true);
    expect(canDeleteListing("")).toBe(false);
  });

  it("deletes through the backend and removes the cached listing for the owner", async () => {
    logIn("seller@example.com");
    axios.delete.mockResolvedValue({ status: 204 });

    await deleteSellerListing("listing-1");

    expect(axios.delete).toHaveBeenCalledWith("/api/listings/listing-1", {
      headers: { "x-seller-email": "seller@example.com" },
    });
    expect(JSON.parse(localStorage.getItem("sellerListings"))).toEqual([]);
  });

  it("refuses to delete when logged out or not the owner", async () => {
    await expect(deleteSellerListing("listing-1")).rejects.toThrow("not-allowed");

    logIn("other@example.com");
    await expect(deleteSellerListing("listing-1")).rejects.toThrow("not-allowed");

    expect(axios.delete).not.toHaveBeenCalled();
    expect(JSON.parse(localStorage.getItem("sellerListings"))).toHaveLength(1);
  });

  it("keeps the listing when the backend rejects the delete", async () => {
    logIn("seller@example.com");
    axios.delete.mockRejectedValue({ response: { status: 403 } });

    await expect(deleteSellerListing("listing-1")).rejects.toBeTruthy();
    expect(JSON.parse(localStorage.getItem("sellerListings"))).toHaveLength(1);
  });
});
