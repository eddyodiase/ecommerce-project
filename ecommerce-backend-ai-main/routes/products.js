import express from 'express';
import { Product } from '../models/Product.js';
import { totalStock } from '../utils/sizeStock.js';

const router = express.Router();

router.get('/', async (req, res) => {
  const search = req.query.search;

  let products;
  if (search) {
    products = await Product.findAll();

    // Filter products by case-insensitive search on name or keywords
    const lowerCaseSearch = search.toLowerCase();

    products = products.filter(product => {
      const nameMatch = product.name.toLowerCase().includes(lowerCaseSearch);

      const keywordsMatch = product.keywords.some(keyword => keyword.toLowerCase().includes(lowerCaseSearch));

      return nameMatch || keywordsMatch;
    });

  } else {
    products = await Product.findAll();
  }

  res.json(products);
});

// Remaining stock by size, e.g. { sizeStock: { M: 4, L: 0 }, totalStock: 4 }.
router.get('/:id/stock', async (req, res) => {
  const product = await Product.findByPk(req.params.id);
  if (!product) {
    return res.status(404).json({ error: 'Product not found' });
  }

  res.json({
    productId: product.id,
    sizeStock: product.sizeStock || {},
    totalStock: totalStock(product.sizeStock)
  });
});

export default router;