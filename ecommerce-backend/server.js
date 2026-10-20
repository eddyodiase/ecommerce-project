import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { sequelize } from './models/index.js';
import productRoutes from './routes/products.js';
import deliveryOptionRoutes from './routes/deliveryOptions.js';
import cartItemRoutes from './routes/cartItems.js';
import orderRoutes from './routes/orders.js';
import resetRoutes from './routes/reset.js';
import paymentSummaryRoutes from './routes/paymentSummary.js';
import { Product } from './models/Product.js';
import { DeliveryOption } from './models/DeliveryOption.js';
import { CartItem } from './models/CartItem.js';
import { Order } from './models/Order.js';
import { defaultProducts } from './defaultData/defaultProducts.js';
import { defaultDeliveryOptions } from './defaultData/defaultDeliveryOptions.js';
import { defaultCart } from './defaultData/defaultCart.js';
import { defaultOrders } from './defaultData/defaultOrders.js';
import fs from 'fs';

const app = express();
const PORT = process.env.PORT || 3000;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middleware
app.use(cors());
app.use(express.json());

// Serve images from the images folder
app.use('/images', express.static(path.join(__dirname, 'images')));

// Use routes
app.use('/api/products', productRoutes);
app.use('/api/delivery-options', deliveryOptionRoutes);
app.use('/api/cart-items', cartItemRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/reset', resetRoutes);
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

// Sync database and ensure default data exists for all required tables.
await sequelize.sync();

async function ensureDefaultData() {
  const timestamp = Date.now();

  const [productCount, deliveryOptionCount, cartItemCount, orderCount] = await Promise.all([
    Product.count(),
    DeliveryOption.count(),
    CartItem.count(),
    Order.count(),
  ]);

  if (productCount === 0) {
    const productsWithTimestamps = defaultProducts.map((product, index) => ({
      ...product,
      createdAt: new Date(timestamp + index),
      updatedAt: new Date(timestamp + index)
    }));

    await Product.bulkCreate(productsWithTimestamps);
    console.log('Default products added to the database.');
  }

  if (deliveryOptionCount === 0) {
    const deliveryOptionsWithTimestamps = defaultDeliveryOptions.map((option, index) => ({
      ...option,
      createdAt: new Date(timestamp + index),
      updatedAt: new Date(timestamp + index)
    }));

    await DeliveryOption.bulkCreate(deliveryOptionsWithTimestamps);
    console.log('Default delivery options added to the database.');
  }

  if (cartItemCount === 0) {
    const cartItemsWithTimestamps = defaultCart.map((item, index) => ({
      ...item,
      createdAt: new Date(timestamp + index),
      updatedAt: new Date(timestamp + index)
    }));

    await CartItem.bulkCreate(cartItemsWithTimestamps);
    console.log('Default cart data added to the database.');
  }

  if (orderCount === 0) {
    const ordersWithTimestamps = defaultOrders.map((order, index) => ({
      ...order,
      createdAt: new Date(timestamp + index),
      updatedAt: new Date(timestamp + index)
    }));

    await Order.bulkCreate(ordersWithTimestamps);
    console.log('Default orders added to the database.');
  }
}

await ensureDefaultData();

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
