export function getProductDisplayName(product) {
  const productObject = product || {};
  return productObject.name || productObject.productName || productObject.title || "Product";
}

export function normalizeCartProduct(product) {
  const productObject = product || {};
  const name = getProductDisplayName(productObject);

  return {
    ...productObject,
    name,
  };
}

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
  const normalizedProduct = normalizeCartProduct(product);
  const guestCart = getGuestCart();
  const existingItem = guestCart[normalizedProduct.id] || {};
  const nextCart = {
    ...guestCart,
    [normalizedProduct.id]: {
      ...existingItem,
      productId: normalizedProduct.id,
      quantity: (Number(existingItem.quantity) || 0) + (Number(quantity) || 0),
      deliveryOptionId: existingItem.deliveryOptionId || "1",
      product: {
        ...(existingItem.product || {}),
        ...normalizedProduct,
        id: normalizedProduct.id,
        name: getProductDisplayName({
          ...(existingItem.product || {}),
          ...normalizedProduct,
          id: normalizedProduct.id,
        }),
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
    product: normalizeCartProduct(item.product || null),
  }));
}

export function getGuestCartTotalQuantity() {
  return Object.values(getGuestCart()).reduce(
    (sum, item) => sum + (Number(item.quantity) || 0),
    0
  );
}
