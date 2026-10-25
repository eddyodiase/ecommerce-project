export function getGuestCart() {
  try {
    const guestCart = JSON.parse(localStorage.getItem("guestCart") || "{}");
    return guestCart && typeof guestCart === "object" ? guestCart : {};
  } catch (error) {
    console.error("Error reading guest cart:", error);
    return {};
  }
}

export function saveGuestCart(nextCart) {
  localStorage.setItem("guestCart", JSON.stringify(nextCart));
  return nextCart;
}

export function addGuestCartItem(product, quantity = 1) {
  const guestCart = getGuestCart();
  const existingItem = guestCart[product.id] || {};
  const nextCart = {
    ...guestCart,
    [product.id]: {
      ...existingItem,
      productId: product.id,
      quantity: (Number(existingItem.quantity) || 0) + (Number(quantity) || 0),
      deliveryOptionId: existingItem.deliveryOptionId || "1",
      product: {
        ...(existingItem.product || {}),
        ...(product || {}),
        id: product.id,
      },
    },
  };

  return saveGuestCart(nextCart);
}

export function updateGuestCart(updater) {
  const nextCart = updater(getGuestCart());
  return saveGuestCart(nextCart);
}

export function removeGuestCartItem(productId) {
  const nextCart = { ...getGuestCart() };
  delete nextCart[productId];
  return saveGuestCart(nextCart);
}

export function getGuestCartItems() {
  return Object.values(getGuestCart()).map((item) => ({
    ...item,
    product: item.product || null,
  }));
}

export function getGuestCartTotalQuantity() {
  return Object.values(getGuestCart()).reduce(
    (sum, item) => sum + (Number(item.quantity) || 0),
    0
  );
}
