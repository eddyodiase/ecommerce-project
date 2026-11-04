import express from 'express';
import { Order } from '../models/Order.js';
import { Product } from '../models/Product.js';
import { DeliveryOption } from '../models/DeliveryOption.js';
import { CartItem } from '../models/CartItem.js';
import { Listing } from '../models/Listing.js';
import { checkSizeAvailability, hasSizeStock } from '../utils/sizeStock.js';

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
    ['phone', 'Phone number'],
    ['addressLine1', 'Street address'],
    ['city', 'City'],
    ['state', 'State']
  ];
  const missing = required.find(([key]) => !address[key]);
  if (missing) {
    return { error: `${missing[1]} is required` };
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

router.post('/', async (req, res) => {
  const { address: shippingAddress, error: addressError } = parseShippingAddress(req.body?.shippingAddress);
  if (addressError) {
    return res.status(400).json({ error: addressError });
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
    shippingAddress
  });

  await decrementStock(cartItems);
  await CartItem.destroy({ where: {} });

  res.status(201).json(order);
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
