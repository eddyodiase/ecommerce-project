import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { Listing } from '../models/Listing.js';
import { Product } from '../models/Product.js';

const router = express.Router();
const VALID_STATUSES = ['pending', 'approved', 'rejected'];

const toListing = (row) => ({ ...row.data, id: row.id, status: row.status });

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const IMAGE_DIR = path.join(__dirname, '..', 'images', 'products');
const EXTENSIONS = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/gif': 'gif' };

// Saves the first uploaded data-URL image as a real file and returns its public path.
const saveImage = (listingId, dataUrl) => {
  const match = /^data:(image\/[a-z+]+);base64,(.+)$/i.exec(dataUrl || '');
  const extension = match && EXTENSIONS[match[1].toLowerCase()];
  if (!extension) {
    return null;
  }

  fs.mkdirSync(IMAGE_DIR, { recursive: true });
  const safeId = listingId.replace(/[^a-zA-Z0-9-_]/g, '');
  const fileName = `${safeId}.${extension}`;
  fs.writeFileSync(path.join(IMAGE_DIR, fileName), Buffer.from(match[2], 'base64'));
  return `images/products/${fileName}`;
};

// Approved listings become real catalogue products (same id as the listing).
const publishProduct = async (row) => {
  const data = row.data || {};
  const image = saveImage(row.id, data.imageDataUrl || (data.imageDataUrls || [])[0]);
  if (!image || await Product.findByPk(row.id)) {
    return;
  }

  const keywords = [data.category, data.sellerName, ...String(data.productName || '').split(/\s+/)]
    .map((word) => String(word || '').trim().toLowerCase().replace(/,/g, ''))
    .filter(Boolean);

  await Product.create({
    id: row.id,
    image,
    name: data.productName || 'Seller listing',
    rating: { stars: 0, count: 0 },
    priceCents: Math.round(Number(data.price || 0) * 100),
    keywords
  });
};

router.get('/', async (req, res) => {
  const rows = await Listing.findAll({ order: [['createdAt', 'DESC']] });
  res.json(rows.map(toListing));
});

router.post('/', async (req, res) => {
  const listing = req.body;
  if (!listing || typeof listing.id !== 'string' || !listing.id) {
    return res.status(400).json({ error: 'Listing id is required' });
  }

  const status = VALID_STATUSES.includes(listing.status) ? listing.status : 'pending';
  const existing = await Listing.findByPk(listing.id);
  const row = existing || await Listing.create({ id: listing.id, status, data: listing });
  res.status(201).json(toListing(row));
});

router.patch('/:id', async (req, res) => {
  const { status } = req.body || {};
  if (!VALID_STATUSES.includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }

  const row = await Listing.findByPk(req.params.id);
  if (!row) {
    return res.status(404).json({ error: 'Listing not found' });
  }

  row.status = status;
  await row.save();

  if (status === 'approved') {
    await publishProduct(row);
  }

  res.json(toListing(row));
});

export default router;
