const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

const readJson = (fileName) => {
  const filePath = path.join(__dirname, fileName);
  return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
};

app.get('/api/products', (req, res) => {
  res.json(readJson('products.json'));
});

app.get('/api/cart', (req, res) => {
  res.json(readJson('cart.json'));
});

app.get('/api/delivery-options', (req, res) => {
  res.json(readJson('deliveryOptions.json'));
});

app.get('/api/orders', (req, res) => {
  res.json(readJson('orders.json'));
});

app.listen(PORT, () => {
  console.log(`Ecommerce backend running on http://localhost:${PORT}`);
});
