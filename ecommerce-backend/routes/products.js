import express from 'express';
import { Product } from '../models/Product.js';

const router = express.Router();

const normalizeString = (value) => String(value || '').trim().toLowerCase();

const deriveBrand = (product) => {
  const name = normalizeString(product?.name);
  if (name.includes('northpeak')) return 'NorthPeak';
  if (name.includes('aurelia')) return 'Aurelia';
  if (name.includes('peak')) return 'Peak & Co';
  if (name.includes('home')) return 'HomeStyle';
  if (name.includes('nest')) return 'Nestline';
  return 'NorthPeak';
};

router.get('/', async (req, res) => {
  const q = req.query.q || req.query.search || '';
  const brand = req.query.brand;
  const rating = Number(req.query.rating || 0);
  const sort = req.query.sort || 'featured';
  const page = Number(req.query.page || 1);
  const pageSize = Number(req.query.pageSize || 48);
  const category = req.query.category ? normalizeString(req.query.category) : '';

  let products = await Product.findAll();

  const normalizedProducts = products.map((product, index) => ({
    ...product.toJSON(),
    id: product.id,
    brand: deriveBrand(product),
    category: category || (product.keywords?.[0] ? String(product.keywords[0]) : 'Home'),
    rating: {
      stars: 4 + ((index % 3) * 0.5),
      count: 75 + ((index * 37) % 5000),
    },
    image: product.image.startsWith('images/') ? `/images/${product.image}` : product.image,
  }));

  let filteredProducts = [...normalizedProducts];
  const lowerCaseSearch = normalizeString(q);

  if (lowerCaseSearch) {
    filteredProducts = filteredProducts.filter((product) => {
      const nameMatch = normalizeString(product.name).includes(lowerCaseSearch);
      const keywordsMatch = (product.keywords || []).some((keyword) =>
        normalizeString(keyword).includes(lowerCaseSearch)
      );
      return nameMatch || keywordsMatch;
    });
  }

  if (brand) {
    const brandFilters = String(brand)
      .split(',')
      .map((entry) => entry.trim())
      .filter(Boolean);

    if (brandFilters.length > 0) {
      filteredProducts = filteredProducts.filter((product) =>
        brandFilters.includes(product.brand)
      );
    }
  }

  if (category) {
    filteredProducts = filteredProducts.filter((product) =>
      normalizeString(product.category).includes(category)
    );
  }

  if (rating > 0) {
    filteredProducts = filteredProducts.filter((product) => {
      const stars = Number(product.rating?.stars || 0);
      return stars >= rating;
    });
  }

  switch (sort) {
    case 'price-low':
      filteredProducts.sort((a, b) => Number(a.priceCents || 0) - Number(b.priceCents || 0));
      break;
    case 'price-high':
      filteredProducts.sort((a, b) => Number(b.priceCents || 0) - Number(a.priceCents || 0));
      break;
    case 'rating':
      filteredProducts.sort((a, b) => Number(b.rating?.stars || 0) - Number(a.rating?.stars || 0));
      break;
    case 'featured':
    default:
      filteredProducts.sort((a, b) =>
        Number(b.rating?.stars || 0) * 1000 + Number(b.rating?.count || 0) -
        (Number(a.rating?.stars || 0) * 1000 + Number(a.rating?.count || 0))
      );
      break;
  }

  const totalItems = filteredProducts.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safePage = Math.min(Math.max(page, 1), totalPages);
  const startIndex = (safePage - 1) * pageSize;
  const paginatedProducts = filteredProducts.slice(startIndex, startIndex + pageSize);

  res.json({
    products: paginatedProducts,
    page: safePage,
    pageSize,
    totalPages,
    totalItems,
  });
});

export default router;