import express from 'express';
import { Listing } from '../models/Listing.js';

const router = express.Router();
const VALID_STATUSES = ['pending', 'approved', 'rejected'];

const toListing = (row) => ({ ...row.data, id: row.id, status: row.status });

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
  res.json(toListing(row));
});

export default router;
