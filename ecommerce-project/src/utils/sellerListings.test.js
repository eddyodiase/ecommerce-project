import axios from "axios";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { canDeleteListing, deleteSellerListing, submitSellerListing, updateSellerListing } from "./sellerListings";

vi.mock("axios");

describe("submitting a listing when the browser cache is full", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.resetAllMocks();
    axios.post.mockResolvedValue({ status: 201 });
  });

  it("does not fail and caches the listing without its photos", async () => {
    const bigImage = `data:image/jpeg;base64,${"a".repeat(2000)}`;
    const original = Storage.prototype.setItem;
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(function setItem(key, value) {
      if (value.length > 1000) {
        throw new DOMException("quota", "QuotaExceededError");
      }
      return original.call(this, key, value);
    });

    await expect(
      submitSellerListing({ id: "listing-2", productName: "Car", status: "pending", imageDataUrl: bigImage, imageDataUrls: [bigImage] })
    ).resolves.toBeUndefined();

    const cached = JSON.parse(localStorage.getItem("sellerListings"));
    expect(cached).toEqual([{ id: "listing-2", productName: "Car", status: "pending" }]);
    vi.restoreAllMocks();
  });
});

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

  it("lets the owner edit a listing without changing owner or status", async () => {
    logIn("seller@example.com");
    axios.put.mockResolvedValue({ data: {} });

    await updateSellerListing("listing-1", { productName: "Big Lamp", ownerEmail: "evil@example.com", status: "pending" });

    expect(axios.put).toHaveBeenCalledWith(
      "/api/listings/listing-1",
      expect.objectContaining({ productName: "Big Lamp", ownerEmail: "seller@example.com",       status: "pending" }),
      { headers: { "x-seller-email": "seller@example.com" } },
    );
    expect(JSON.parse(localStorage.getItem("sellerListings"))[0].productName).toBe("Big Lamp");
  });

  it("refuses to edit a listing the user does not own", async () => {
    logIn("other@example.com");
    await expect(updateSellerListing("listing-1", { productName: "X" })).rejects.toThrow("not-allowed");
    expect(axios.put).not.toHaveBeenCalled();
  });
});
