import crypto from 'crypto';
import { Order } from '../models/Order.js';
import { Product } from '../models/Product.js';
import { Listing } from '../models/Listing.js';
import {
  buildReference,
  initializePaystack,
  orderIdFromReference,
  paymentConfig,
  refundPaystack,
  verifyPaystack
} from './payments.js';
import { hasSizeStock } from './sizeStock.js';

export const logEvent = (order, event, detail = '') => {
  order.paymentLog = [...(order.paymentLog || []), { atMs: Date.now(), event, detail: String(detail).slice(0, 300) }];
};

// Returns ordered quantities of sized products to stock, once per order.
export const releaseOrderStock = async (order) => {
  if (order.stockReleased) {
    return;
  }

  for (const item of order.products || []) {
    if (!item.size) {
      continue;
    }

    const product = await Product.findByPk(item.productId);
    if (!product || !hasSizeStock(product.sizeStock)) {
      continue;
    }

    const nextStock = { ...product.sizeStock, [item.size]: (Number(product.sizeStock[item.size]) || 0) + item.quantity };
    product.sizeStock = nextStock;
    await product.save();

    const listing = await Listing.findByPk(item.productId);
    if (listing) {
      listing.data = { ...listing.data, sizeStock: nextStock };
      await listing.save();
    }
  }

  order.stockReleased = true;
  logEvent(order, 'stock_released');
};

export const startPaystackPayment = async (order) => {
  const reference = buildReference(order.id);
  const data = await initializePaystack({
    email: order.shippingAddress?.email,
    amountKobo: order.totalCostCents,
    reference,
    orderId: order.id
  });
  order.paymentReference = reference;
  logEvent(order, 'paystack_initialized', reference);
  await order.save();
  return data.authorization_url;
};

// Idempotent: a second webhook/verify for an already-paid order changes nothing.
export const markOrderPaid = async (order, { reference, note = '' } = {}) => {
  if (['paid', 'partially_refunded', 'refunded'].includes(order.paymentStatus)) {
    return order;
  }

  order.paymentStatus = 'paid';
  order.paidAtMs = Date.now();
  if (reference) {
    order.paymentReference = reference;
  }
  logEvent(order, 'paid', note || reference || '');
  await order.save();

  // Paid after the order was cancelled/expired (stock already released): return the money instead of fulfilling.
  if (order.status === 'cancelled') {
    try {
      await issueRefund(order, { amountCents: order.totalCostCents, reason: 'Payment received after order was cancelled', actor: 'system' });
    } catch (error) {
      logEvent(order, 'auto_refund_failed', error.message);
      await order.save();
    }
  }
  return order;
};

// Checks a Paystack reference with Paystack itself. Never trust the browser's redirect.
export const settlePaystackReference = async (reference) => {
  const order = await Order.findByPk(orderIdFromReference(reference));
  if (!order || order.paymentMethod !== 'paystack') {
    return { error: 'Order not found for this reference', status: 404 };
  }

  const data = await verifyPaystack(reference);
  if (data.status === 'success') {
    if (Number(data.amount) !== Number(order.totalCostCents) || String(data.currency || 'NGN') !== 'NGN') {
      logEvent(order, 'amount_mismatch', `paid ${data.amount} ${data.currency}, expected ${order.totalCostCents} NGN`);
      await order.save();
      return { error: 'Paid amount does not match the order total', status: 409, order };
    }
    await markOrderPaid(order, { reference });
  } else if (data.status === 'failed' && order.paymentStatus === 'pending') {
    order.paymentStatus = 'failed';
    order.status = 'cancelled';
    logEvent(order, 'payment_failed', reference);
    await releaseOrderStock(order);
    await order.save();
  }
  return { order, providerStatus: data.status };
};

const sumRefunded = (refunds) => refunds
  .filter((entry) => entry.status !== 'failed')
  .reduce((sum, entry) => sum + entry.amountCents, 0);

// Refunds a paid order, fully or partially. Paystack orders are refunded through Paystack;
// bank transfer / pay on delivery refunds are recorded after the store has returned the money manually.
export const issueRefund = async (order, { amountCents, reason = '', restock = false, actor = 'admin' }) => {
  if (!['paid', 'partially_refunded'].includes(order.paymentStatus)) {
    const error = new Error('Only paid orders can be refunded');
    error.status = 409;
    throw error;
  }

  const refunds = order.refunds || [];
  const remaining = order.totalCostCents - sumRefunded(refunds);
  const amount = amountCents === undefined ? remaining : Number(amountCents);
  if (!Number.isInteger(amount) || amount <= 0 || amount > remaining) {
    const error = new Error(`Refund must be a whole amount between 1 and ${remaining} kobo`);
    error.status = 400;
    throw error;
  }

  const entry = {
    id: crypto.randomUUID(),
    amountCents: amount,
    reason: String(reason).slice(0, 300),
    method: order.paymentMethod,
    status: 'processed',
    createdAtMs: Date.now(),
    actor,
    providerRef: ''
  };

  if (order.paymentMethod === 'paystack') {
    let result;
    try {
      result = await refundPaystack({ reference: order.paymentReference, amountKobo: amount, note: entry.reason });
    } catch (cause) {
      const error = new Error(`Paystack refund failed: ${cause.message}`);
      error.status = 502;
      throw error;
    }
    entry.providerRef = String(result?.id ?? '');
    entry.status = ['processed', 'success'].includes(result?.status) ? 'processed' : 'pending';
  }

  order.refunds = [...refunds, entry];
  order.refundedCents = sumRefunded(order.refunds);
  const fullyRefunded = order.refundedCents >= order.totalCostCents;
  order.paymentStatus = fullyRefunded ? 'refunded' : 'partially_refunded';
  if (fullyRefunded) {
    order.status = 'refunded';
    if (restock) {
      await releaseOrderStock(order);
    }
  }
  logEvent(order, 'refund', `${amount} kobo (${entry.status}) by ${actor}`);
  await order.save();
  return entry;
};

// Cancels an unpaid order and returns its reserved stock.
export const cancelUnpaidOrder = async (order, { paymentStatus = 'cancelled', note = '' } = {}) => {
  order.status = 'cancelled';
  order.paymentStatus = paymentStatus;
  logEvent(order, paymentStatus, note);
  await releaseOrderStock(order);
  await order.save();
};

// Unpaid card/transfer orders hold stock, so they expire after ORDER_PAYMENT_TTL_HOURS.
export const expireUnpaidOrders = async () => {
  const cutoff = Date.now() - paymentConfig().paymentWindowMs;
  const candidates = await Order.unscoped().findAll({
    where: { status: 'placed', paymentStatus: 'pending' }
  });

  for (const order of candidates) {
    if (!['paystack', 'bank_transfer'].includes(order.paymentMethod) || Number(order.orderTimeMs) > cutoff) {
      continue;
    }

    try {
      if (order.paymentMethod === 'paystack' && order.paymentReference) {
        const settled = await settlePaystackReference(order.paymentReference);
        if (settled.order?.paymentStatus !== 'pending') {
          continue;
        }
      }
      await cancelUnpaidOrder(order, { paymentStatus: 'expired', note: 'No payment within the payment window' });
    } catch (error) {
      console.error(`Could not expire order ${order.id}:`, error.message);
    }
  }
};
