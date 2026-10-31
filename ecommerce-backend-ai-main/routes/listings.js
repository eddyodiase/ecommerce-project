import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { Listing } from '../models/Listing.js';
import { Product } from '../models/Product.js';
import { CartItem } from '../models/CartItem.js';

const router = express.Router();
const VALID_STATUSES = ['pending', 'approved', 'rejected'];

const toListing = (row) => ({ ...row.data, id: row.id, status: row.status });

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const IMAGE_DIR = path.join(__dirname, '..', 'images', 'products');
const EXTENSIONS = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/gif': 'gif' };

// Saves an uploaded data-URL image as a real file and returns its public path.
// The primary image is `<id>.<ext>`; extra gallery images are `<id>-<n>.<ext>`.
const saveImage = (listingId, dataUrl, index = 0) => {
  const match = /^data:(image\/[a-z+]+);base64,(.+)$/i.exec(dataUrl || '');
  const extension = match && EXTENSIONS[match[1].toLowerCase()];
  if (!extension) {
    return null;
  }

  fs.mkdirSync(IMAGE_DIR, { recursive: true });
  const safeId = listingId.replace(/[^a-zA-Z0-9-_]/g, '');
  const fileName = index === 0 ? `${safeId}.${extension}` : `${safeId}-${index}.${extension}`;
  fs.writeFileSync(path.join(IMAGE_DIR, fileName), Buffer.from(match[2], 'base64'));
  return `images/products/${fileName}`;
};

// Approved listings become real catalogue products (same id as the listing).
const publishProduct = async (row) => {
  const data = row.data || {};
  const dataUrls = Array.isArray(data.imageDataUrls) && data.imageDataUrls.length
    ? data.imageDataUrls
    : [data.imageDataUrl].filter(Boolean);
  const galleryImages = dataUrls.map((url, index) => saveImage(row.id, url, index)).filter(Boolean);
  const image = galleryImages[0];
  if (!image || await Product.findByPk(row.id)) {
    return;
  }

  const keywords = [data.category, data.subcategory, data.sellerName, ...String(data.productName || '').split(/\s+/)]
    .map((word) => String(word || '').trim().toLowerCase().replace(/,/g, ''))
    .filter(Boolean);

  await Product.create({
    id: row.id,
    image,
    name: data.productName || 'Seller listing',
    rating: { stars: 0, count: 0 },
    priceCents: Math.round(Number(data.price || 0) * 100),
    ownerEmail: data.ownerEmail || null,
    keywords,
    details: {
      category: data.category || '',
      subcategory: data.subcategory || '',
      condition: data.condition || '',
      description: data.description || '',
      sellerName: data.sellerName || '',
      originLocation: data.originLocation || '',
      nafdacNo: data.nafdacNo || '',
      phoneSpecs: data.phoneSpecs || null,
      galleryImages
    }
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

const normalizeEmail = (value) => String(value || '').trim().toLowerCase();

// Removes every image file written by saveImage for a listing.
const removeImages = (listingId) => {
  const safeId = listingId.replace(/[^a-zA-Z0-9-_]/g, '');
  const pattern = new RegExp(`^${safeId}(-\\d+)?\\.(${Object.values(EXTENSIONS).join('|')})$`);
  if (!fs.existsSync(IMAGE_DIR)) {
    return;
  }
  fs.readdirSync(IMAGE_DIR)
    .filter((fileName) => pattern.test(fileName))
    .forEach((fileName) => fs.rmSync(path.join(IMAGE_DIR, fileName), { force: true }));
};

// Only the seller who created a listing may edit it. Status and ownership are never changed here.
router.put('/:id', async (req, res) => {
  const row = await Listing.findByPk(req.params.id);
  if (!row) {
    return res.status(404).json({ error: 'Listing not found' });
  }

  const owner = normalizeEmail(row.data?.ownerEmail);
  if (!owner || owner !== normalizeEmail(req.get('x-seller-email'))) {
    return res.status(403).json({ error: 'Only the seller who listed this product can edit it' });
  }

  const updates = req.body || {};
  const price = Number(updates.price);
  if (!String(updates.productName || '').trim() || !Number.isFinite(price) || price <= 0) {
    return res.status(400).json({ error: 'Product name and a valid price are required' });
  }

  row.data = {
    ...updates,
    id: row.id,
    ownerEmail: row.data.ownerEmail,
    createdAt: row.data.createdAt,
    status: 'pending'
  };
  row.status = 'pending';
  await row.save();

  // Edited listings leave the storefront until re-approved; approval republishes them with the new details.
  await CartItem.destroy({ where: { productId: row.id } });
  await Product.destroy({ where: { id: row.id } });
  removeImages(row.id);

  res.json(toListing(row));
});

// Only the logged-in seller who created a listing may delete it.
router.delete('/:id', async (req, res) => {
  const row = await Listing.findByPk(req.params.id);
  // Catalogue products without a listing record (e.g. default products) carry their own owner.
  const product = await Product.findByPk(req.params.id);
  if (!row && !product) {
    return res.status(404).json({ error: 'Listing not found' });
  }

  const owner = normalizeEmail(row ? row.data?.ownerEmail : product.ownerEmail);
  if (!owner || owner !== normalizeEmail(req.get('x-seller-email'))) {
    return res.status(403).json({ error: 'Only the seller who listed this product can delete it' });
  }

  await CartItem.destroy({ where: { productId: req.params.id } });
  await Product.destroy({ where: { id: req.params.id } });
  if (row) {
    await row.destroy();
    removeImages(row.id);
  }
  res.status(204).send();
});

export default router;
