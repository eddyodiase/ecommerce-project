export const SHIPPING_ADDRESS_STORAGE_KEY = "shippingAddress";

export const EMPTY_SHIPPING_ADDRESS = {
  fullName: "",
  email: "",
  phone: "",
  addressLine1: "",
  addressLine2: "",
  city: "",
  state: "",
  postalCode: "",
  country: "Nigeria",
};

const PHONE_PATTERN = /^\+?[0-9][0-9\s-]{6,18}$/;

/** Returns an object of field -> message; empty when the address is valid. */
export function validateShippingAddress(address) {
  const errors = {};
  const value = (key) => String(address?.[key] ?? "").trim();

  if (!value("fullName")) errors.fullName = "Enter your full name.";
  if (!value("email")) errors.email = "Enter your email address.";
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value("email"))) errors.email = "Enter a valid email address.";
  if (!value("phone")) errors.phone = "Enter your phone number.";
  else if (!PHONE_PATTERN.test(value("phone"))) errors.phone = "Enter a valid phone number.";
  if (!value("addressLine1")) errors.addressLine1 = "Enter your street address.";
  if (!value("city")) errors.city = "Enter your city.";
  if (!value("state")) errors.state = "Enter your state.";

  return errors;
}

export function loadShippingAddress() {
  try {
    const parsed = JSON.parse(localStorage.getItem(SHIPPING_ADDRESS_STORAGE_KEY) || "null");
    return parsed && typeof parsed === "object" ? { ...EMPTY_SHIPPING_ADDRESS, ...parsed } : { ...EMPTY_SHIPPING_ADDRESS };
  } catch {
    return { ...EMPTY_SHIPPING_ADDRESS };
  }
}

export function saveShippingAddress(address) {
  try {
    localStorage.setItem(SHIPPING_ADDRESS_STORAGE_KEY, JSON.stringify(address));
  } catch {
    // Saving the address for next time is a convenience only.
  }
}
