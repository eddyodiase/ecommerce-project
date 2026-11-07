const ORDER_ACCESS_TOKEN_KEY = "orderAccessToken";

export const getOrderAccessToken = () => (
  typeof localStorage === "undefined" ? "" : localStorage.getItem(ORDER_ACCESS_TOKEN_KEY) || ""
);

export const saveOrderAccessToken = (token) => {
  if (typeof localStorage !== "undefined" && typeof token === "string" && token) {
    localStorage.setItem(ORDER_ACCESS_TOKEN_KEY, token);
  }
};

export const getOrCreateOrderAccessToken = () => {
  const existing = getOrderAccessToken();
  if (existing) return existing;
  if (!globalThis.crypto?.getRandomValues) {
    throw new Error("Secure random order access tokens are not supported in this browser.");
  }

  const bytes = globalThis.crypto.getRandomValues(new Uint8Array(32));
  const token = Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
  saveOrderAccessToken(token);
  return token;
};

export const getOrderAccessConfig = () => {
  const token = getOrderAccessToken();
  return token ? { headers: { "x-order-access-token": token } } : { headers: {} };
};
