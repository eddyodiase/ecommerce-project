import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { sequelize, saveDatabaseToFile } from './models/index.js';
import productRoutes from './routes/products.js';
import deliveryOptionRoutes from './routes/deliveryOptions.js';
import cartItemRoutes from './routes/cartItems.js';
import orderRoutes from './routes/orders.js';
import resetRoutes from './routes/reset.js';
import paymentSummaryRoutes from './routes/paymentSummary.js';
import listingRoutes, { republishApprovedListings } from './routes/listings.js';
import './models/Listing.js';
import { Product } from './models/Product.js';
import { DeliveryOption } from './models/DeliveryOption.js';
import { CartItem } from './models/CartItem.js';
import { Order } from './models/Order.js';
import { defaultProducts } from './defaultData/defaultProducts.js';
import { defaultDeliveryOptions } from './defaultData/defaultDeliveryOptions.js';
import { defaultCart } from './defaultData/defaultCart.js';
import { defaultOrders } from './defaultData/defaultOrders.js';
import fs from 'fs';
import { DataTypes } from 'sequelize';

const app = express();
const PORT = process.env.PORT || 3000;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Serve images from the images folder
app.use('/images', express.static(path.join(__dirname, 'images')));

// Use routes
app.use('/api/products', productRoutes);
app.use('/api/delivery-options', deliveryOptionRoutes);
app.use('/api/cart-items', cartItemRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/reset', resetRoutes);
app.use('/api/listings', listingRoutes);
app.use('/api/payment-summary', paymentSummaryRoutes);

// Serve static files from the dist folder
app.use(express.static(path.join(__dirname, 'dist')));

// Catch-all route to serve index.html for any unmatched routes
app.get('*', (req, res) => {
  const indexPath = path.join(__dirname, 'dist', 'index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(404).send('index.html not found');
  }
});

// Error handling middleware
/* eslint-disable no-unused-vars */
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});
/* eslint-enable no-unused-vars */

// Sync database and load default data if none exist
await sequelize.sync();

// sync() does not add columns to existing tables, so add ownerEmail to older databases.
const productColumns = await sequelize.getQueryInterface().describeTable('Products');
if (!productColumns.ownerEmail) {
  await sequelize.getQueryInterface().addColumn('Products', 'ownerEmail', { type: DataTypes.STRING, allowNull: true });
}
if (!productColumns.details) {
  await sequelize.getQueryInterface().addColumn('Products', 'details', { type: DataTypes.JSON, allowNull: true });
}

if (!productColumns.sizeStock) {
  await sequelize.getQueryInterface().addColumn('Products', 'sizeStock', { type: DataTypes.JSON, allowNull: true });
}
const cartColumns = await sequelize.getQueryInterface().describeTable('CartItems');
if (!cartColumns.size) {
  await sequelize.getQueryInterface().addColumn('CartItems', 'size', { type: DataTypes.STRING, allowNull: false, defaultValue: '' });
}

const orderColumns = await sequelize.getQueryInterface().describeTable('Orders');
if (!orderColumns.shippingAddress) {
  await sequelize.getQueryInterface().addColumn('Orders', 'shippingAddress', { type: DataTypes.JSON, allowNull: true });
}

if (typeof saveDatabaseToFile === 'function' && !process.env.RDS_HOSTNAME) {
  await saveDatabaseToFile();
}

const productCount = await Product.count();
if (productCount === 0) {
  const timestamp = Date.now();

  const productsWithTimestamps = defaultProducts.map((product, index) => ({
    ...product,
    createdAt: new Date(timestamp + index),
    updatedAt: new Date(timestamp + index)
  }));

  const deliveryOptionsWithTimestamps = defaultDeliveryOptions.map((option, index) => ({
    ...option,
    createdAt: new Date(timestamp + index),
    updatedAt: new Date(timestamp + index)
  }));

  const cartItemsWithTimestamps = defaultCart.map((item, index) => ({
    ...item,
    createdAt: new Date(timestamp + index),
    updatedAt: new Date(timestamp + index)
  }));

  const ordersWithTimestamps = defaultOrders.map((order, index) => ({
    ...order,
    createdAt: new Date(timestamp + index),
    updatedAt: new Date(timestamp + index)
  }));

  await Product.bulkCreate(productsWithTimestamps);
  await DeliveryOption.bulkCreate(deliveryOptionsWithTimestamps);
  await CartItem.bulkCreate(cartItemsWithTimestamps);
  await Order.bulkCreate(ordersWithTimestamps);

  console.log('Default data added to the database.');
}

const republished = await republishApprovedListings();
if (republished > 0) {
  console.log(`Republished ${republished} approved listing(s) missing from the catalogue.`);
  if (typeof saveDatabaseToFile === 'function' && !process.env.RDS_HOSTNAME) {
    await saveDatabaseToFile();
  }
}

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
