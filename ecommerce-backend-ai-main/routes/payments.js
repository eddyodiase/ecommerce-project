import express from 'express';
import { Order } from '../models/Order.js';
import { availableMethods, isValidPaystackSignature, orderIdFromReference } from '../utils/payments.js';
import { logEvent, markOrderPaid, settlePaystackReference } from '../utils/orderPayments.js';

const router = express.Router();

// What the checkout may offer, and where bank transfers should be sent.
router.get('/methods', (req, res) => {
  res.json(availableMethods());
});

// Called when the buyer returns from Paystack. The status always comes from Paystack, not from the URL.
router.get('/paystack/verify', async (req, res) => {
  const reference = String(req.query.reference || '');
  if (!orderIdFromReference(reference)) {
    return res.status(400).json({ error: 'Invalid payment reference' });
  }

  try {
    const result = await settlePaystackReference(reference);
    if (result.error && !result.order) {
      return res.status(result.status).json({ error: result.error });
    }
    if (result.error) {
      return res.status(result.status).json({ error: result.error, orderId: result.order.id });
    }

    res.json({
      orderId: result.order.id,
      paymentStatus: result.order.paymentStatus,
      providerStatus: result.providerStatus
    });
  } catch (error) {
    console.error('Paystack verify failed:', error.message);
    res.status(502).json({ error: 'We could not confirm the payment yet. Please check again shortly.' });
  }
});

// Paystack calls this server-to-server. Only requests signed with our secret key are accepted.
router.post('/paystack/webhook', async (req, res) => {
  if (!isValidPaystackSignature(req.rawBody, req.get('x-paystack-signature'))) {
    return res.status(401).json({ error: 'Invalid signature' });
  }

  const { event, data } = req.body || {};
  try {
    if (event === 'charge.success') {
      const order = await Order.findByPk(orderIdFromReference(data?.reference));
      if (order && order.paymentMethod === 'paystack') {
        if (Number(data.amount) === Number(order.totalCostCents) && String(data.currency || 'NGN') === 'NGN') {
          await markOrderPaid(order, { reference: data.reference, note: 'webhook' });
        } else {
          logEvent(order, 'amount_mismatch', `webhook paid ${data.amount} ${data.currency}`);
          await order.save();
        }
      }
    } else if (event === 'refund.processed' || event === 'refund.failed') {
      const order = await Order.findByPk(orderIdFromReference(data?.transaction_reference));
      if (order) {
        const status = event === 'refund.processed' ? 'processed' : 'failed';
        order.refunds = (order.refunds || []).map((refund) => (
          String(refund.providerRef) === String(data?.id) ? { ...refund, status } : refund
        ));
        if (status === 'failed') {
          const live = order.refunds.filter((refund) => refund.status !== 'failed');
          order.refundedCents = live.reduce((sum, refund) => sum + refund.amountCents, 0);
          order.paymentStatus = order.refundedCents === 0 ? 'paid' : 'partially_refunded';
          if (order.status === 'refunded') {
            order.status = 'placed';
          }
        }
        logEvent(order, `refund_${status}`, String(data?.id || ''));
        await order.save();
      }
    }
  } catch (error) {
    // A non-2xx makes Paystack retry the delivery later.
    console.error('Paystack webhook handling failed:', error.message);
    return res.status(500).json({ error: 'Webhook handling failed' });
  }

  res.sendStatus(200);
});

export default router;
