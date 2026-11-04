import express from 'express';
import { Order } from '../models/Order.js';
import { Product } from '../models/Product.js';
import { DeliveryOption } from '../models/DeliveryOption.js';
import { CartItem } from '../models/CartItem.js';
import { Listing } from '../models/Listing.js';
import { checkSizeAvailability, hasSizeStock } from '../utils/sizeStock.js';
import { PAYMENT_METHODS, availableMethods, requireAdmin } from '../utils/payments.js';
import {
  cancelUnpaidOrder,
  issueRefund,
  markOrderPaid,
  startPaystackPayment
} from '../utils/orderPayments.js';

const router = express.Router();

router.get('/', async (req, res) => {
  const expand = req.query.expand;
  let orders = await Order.unscoped().findAll({ order: [['orderTimeMs', 'DESC']] }); // Sort by most recent

  if (expand === 'products') {
    orders = await Promise.all(orders.map(async (order) => {
      const products = await Promise.all(order.products.map(async (product) => {
        const productDetails = await Product.findByPk(product.productId);
        return {
          ...product,
          product: productDetails
        };
      }));
      return {
        ...order.toJSON(),
        products
      };
    }));
  }

  res.json(orders);
});

const clean = (value) => (typeof value === 'string' ? value.trim().slice(0, 200) : '');

// Returns { address } with trimmed fields, or { error } describing the first problem.
const parseShippingAddress = (input) => {
  const source = input && typeof input === 'object' ? input : {};
  const address = {
    fullName: clean(source.fullName),
    email: clean(source.email).toLowerCase(),
    phone: clean(source.phone),
    addressLine1: clean(source.addressLine1),
    addressLine2: clean(source.addressLine2),
    city: clean(source.city),
    state: clean(source.state),
    postalCode: clean(source.postalCode),
    country: clean(source.country) || 'Nigeria'
  };

  const required = [
    ['fullName', 'Full name'],
    ['email', 'Email address'],
    ['phone', 'Phone number'],
    ['addressLine1', 'Street address'],
    ['city', 'City'],
    ['state', 'State']
  ];
  const missing = required.find(([key]) => !address[key]);
  if (missing) {
    return { error: `${missing[1]} is required` };
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(address.email)) {
    return { error: 'Enter a valid email address' };
  }
  if (!/^\+?[0-9][0-9\s-]{6,18}$/.test(address.phone)) {
    return { error: 'Enter a valid phone number' };
  }
  return { address };
};

// Removes ordered quantities from each product's size stock and mirrors the result onto the
// seller's listing, so editing a listing later starts from the real remaining stock.
const decrementStock = async (cartItems) => {
  for (const item of cartItems) {
    if (!item.size) {
      continue;
    }

    const product = await Product.findByPk(item.productId);
    if (!product || !hasSizeStock(product.sizeStock)) {
      continue;
    }

    const nextStock = {
      ...product.sizeStock,
      [item.size]: Math.max(0, (Number(product.sizeStock[item.size]) || 0) - item.quantity)
    };
    product.sizeStock = nextStock;
    await product.save();

    const listing = await Listing.findByPk(item.productId);
    if (listing) {
      listing.data = { ...listing.data, sizeStock: nextStock };
      await listing.save();
    }
  }
};

// The cart is shared and stock is checked then reserved in separate steps, so orders are placed one at a time.
let placeOrderQueue = Promise.resolve();
const placeOneAtATime = (task) => {
  const run = placeOrderQueue.then(task, task);
  placeOrderQueue = run.catch(() => {});
  return run;
};

const paymentFields = (order) => ({ ...order.toJSON() });

router.post('/', (req, res, next) => placeOneAtATime(async () => {
  const { address: shippingAddress, error: addressError } = parseShippingAddress(req.body?.shippingAddress);
  if (addressError) {
    return res.status(400).json({ error: addressError });
  }

  const paymentMethod = req.body?.paymentMethod;
  if (!PAYMENT_METHODS.includes(paymentMethod)) {
    return res.status(400).json({ error: 'Choose a payment method' });
  }
  if (!availableMethods()[paymentMethod].enabled) {
    return res.status(400).json({ error: 'That payment method is not available right now' });
  }

  // A retried request (double click, flaky network) returns the original order instead of a duplicate.
  const idempotencyKey = String(req.get('idempotency-key') || req.body?.idempotencyKey || '').slice(0, 100);
  if (idempotencyKey) {
    const previous = await Order.unscoped().findOne({ where: { idempotencyKey } });
    if (previous) {
      return res.status(200).json({ ...paymentFields(previous), ...(await tryStartPaystack(previous)) });
    }
  }

  const cartItems = await CartItem.findAll();

  if (cartItems.length === 0) {
    return res.status(400).json({ error: 'Cart is empty' });
  }

  // Confirm every sized item is still in stock before anything is charged or decremented.
  for (const item of cartItems) {
    const stocked = await Product.findByPk(item.productId);
    const stockError = stocked ? checkSizeAvailability(stocked, item.size, item.quantity) : '';
    if (stockError) {
      return res.status(409).json({ error: `${stocked.name}: ${stockError}` });
    }
  }

  let totalCostCents = 0;
  const products = await Promise.all(cartItems.map(async (item) => {
    const product = await Product.findByPk(item.productId);
    if (!product) {
      throw new Error(`Product not found: ${item.productId}`);
    }
    const deliveryOption = await DeliveryOption.findByPk(item.deliveryOptionId);
    if (!deliveryOption) {
      throw new Error(`Invalid delivery option: ${item.deliveryOptionId}`);
    }
    const productCost = product.priceCents * item.quantity;
    const shippingCost = deliveryOption.priceCents;
    totalCostCents += productCost + shippingCost;
    const estimatedDeliveryTimeMs = Date.now() + deliveryOption.deliveryDays * 24 * 60 * 60 * 1000;
    return {
      productId: item.productId,
      quantity: item.quantity,
      size: item.size || '',
      estimatedDeliveryTimeMs
    };
  }));

  totalCostCents = Math.round(totalCostCents * 1.1);

  const order = await Order.create({
    orderTimeMs: Date.now(),
    totalCostCents,
    products,
    shippingAddress,
    paymentMethod,
    paymentStatus: 'pending',
    idempotencyKey: idempotencyKey || null,
    refunds: [],
    paymentLog: [{ atMs: Date.now(), event: 'order_placed', detail: paymentMethod }]
  });

  await decrementStock(cartItems);
  await CartItem.destroy({ where: {} });

  res.status(201).json({ ...paymentFields(order), ...(await tryStartPaystack(order)) });
}).catch(next));

// Starts a Paystack payment for pending Paystack orders. A failure never loses the order:
// the buyer can retry from the Orders page.
const tryStartPaystack = async (order) => {
  if (order.paymentMethod !== 'paystack' || order.paymentStatus !== 'pending' || order.status !== 'placed') {
    return {};
  }
  try {
    return { authorizationUrl: await startPaystackPayment(order) };
  } catch (error) {
    console.error(`Could not start Paystack payment for ${order.id}:`, error.message);
    return { paymentError: 'We could not start the card payment. You can retry it from your orders.' };
  }
};

// Buyer retry of an unpaid card payment.
router.post('/:orderId/pay', async (req, res) => {
  const order = await Order.findByPk(req.params.orderId);
  if (!order) {
    return res.status(404).json({ error: 'Order not found' });
  }
  if (order.paymentMethod !== 'paystack' || order.paymentStatus !== 'pending' || order.status !== 'placed') {
    return res.status(409).json({ error: 'This order is not waiting for a card payment' });
  }

  const result = await tryStartPaystack(order);
  if (!result.authorizationUrl) {
    return res.status(502).json(result);
  }
  res.json(result);
});

// Admin: confirm that a bank transfer arrived, or cash was collected on delivery.
router.post('/:orderId/confirm-payment', requireAdmin, async (req, res) => {
  const order = await Order.findByPk(req.params.orderId);
  if (!order) {
    return res.status(404).json({ error: 'Order not found' });
  }
  if (!['bank_transfer', 'pay_on_delivery'].includes(order.paymentMethod)) {
    return res.status(409).json({ error: 'Card payments are confirmed automatically by Paystack' });
  }
  if (order.status !== 'placed' || order.paymentStatus !== 'pending') {
    return res.status(409).json({ error: 'This order is not waiting for payment' });
  }

  const note = String(req.body?.note || '').slice(0, 200);
  await markOrderPaid(order, { reference: String(req.body?.reference || '').slice(0, 100) || undefined, note });
  res.json(order);
});

// Admin: cancel an unpaid order and return its stock. Paid orders must be refunded instead.
router.post('/:orderId/cancel', requireAdmin, async (req, res) => {
  const order = await Order.findByPk(req.params.orderId);
  if (!order) {
    return res.status(404).json({ error: 'Order not found' });
  }
  if (order.status !== 'placed' || order.paymentStatus !== 'pending') {
    return res.status(409).json({ error: 'Only unpaid orders can be cancelled. Refund paid orders instead.' });
  }

  await cancelUnpaidOrder(order, { note: String(req.body?.reason || '').slice(0, 200) });
  res.json(order);
});

// Admin: full or partial refund. amountCents is optional (defaults to everything still refundable).
router.post('/:orderId/refund', requireAdmin, async (req, res) => {
  const order = await Order.findByPk(req.params.orderId);
  if (!order) {
    return res.status(404).json({ error: 'Order not found' });
  }

  try {
    const refund = await issueRefund(order, {
      amountCents: req.body?.amountCents,
      reason: req.body?.reason,
      restock: req.body?.restock === true
    });
    res.json({ refund, order });
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message });
  }
});

router.get('/:orderId', async (req, res) => {
  const { orderId } = req.params;
  const expand = req.query.expand;

  let order = await Order.findByPk(orderId);
  if (!order) {
    return res.status(404).json({ error: 'Order not found' });
  }

  if (expand === 'products') {
    const products = await Promise.all(order.products.map(async (product) => {
      const productDetails = await Product.findByPk(product.productId);
      return {
        ...product,
        product: productDetails
      };
    }));
    order = {
      ...order.toJSON(),
      products
    };
  }

  res.json(order);
});

export default router;
