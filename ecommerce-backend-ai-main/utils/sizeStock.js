const MAX_STOCK_PER_SIZE = 100000;

// Cleans a seller-supplied { size: quantity } map: trimmed size labels, whole non-negative quantities.
export const normalizeSizeStock = (input) => {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    return {};
  }

  const result = {};
  for (const [rawSize, rawQuantity] of Object.entries(input)) {
    const size = String(rawSize).trim().slice(0, 30);
    const quantity = Number(rawQuantity);
    if (size && Number.isInteger(quantity) && quantity >= 0 && quantity <= MAX_STOCK_PER_SIZE) {
      result[size] = quantity;
    }
  }
  return result;
};

export const hasSizeStock = (sizeStock) => (
  Boolean(sizeStock) && typeof sizeStock === 'object' && Object.keys(sizeStock).length > 0
);

export const totalStock = (sizeStock) => (
  hasSizeStock(sizeStock) ? Object.values(sizeStock).reduce((sum, quantity) => sum + Number(quantity || 0), 0) : null
);

export const isQuantityOnlyProduct = (product) => {
  const category = product?.details?.category || product?.category;
  const subcategory = product?.details?.subcategory || product?.subcategory;
  return String(category || '').trim().toLowerCase() === 'fashion'
    && String(subcategory || '').trim().toLowerCase() === 'sports - sports goods';
};

// Returns an error message when `quantity` of `size` cannot be supplied, otherwise ''.
export const checkSizeAvailability = (product, size, quantity) => {
  const sizeStock = product.sizeStock;
  if (!hasSizeStock(sizeStock)) {
    return '';
  }
  if (isQuantityOnlyProduct(product)) {
    const available = Number(sizeStock.Stock) || 0;
    if (size) {
      return 'This item does not have size options';
    }
    if (available <= 0) {
      return 'This item is out of stock';
    }
    return quantity > available ? `Only ${available} left in stock` : '';
  }
  if (!size) {
    return 'Please select a size';
  }
  if (!Object.prototype.hasOwnProperty.call(sizeStock, size)) {
    return `Size ${size} is not available for this product`;
  }

  const available = Number(sizeStock[size]) || 0;
  if (available <= 0) {
    return `Size ${size} is out of stock`;
  }
  if (quantity > available) {
    return `Only ${available} left in size ${size}`;
  }
  return '';
};
