import express from 'express';
import { authenticateAdmin, paymentConfig } from '../utils/payments.js';

const router = express.Router();

router.post('/login', (req, res) => {
  const { email, password } = req.body || {};
  if (!authenticateAdmin(email, password)) {
    return res.status(401).json({ error: 'Invalid admin email or password' });
  }
  return res.json({ adminApiKey: paymentConfig().adminApiKey });
});

export default router;
