import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import express from 'express';

process.env.NODE_ENV = 'test';
process.env.ADMIN_API_KEY = 'test-admin-key';
process.env.PAYSTACK_SECRET_KEY = 'test-paystack-key';
process.env.PAYSTACK_ENABLED = 'false';
process.env.PAY_ON_DELIVERY_ENABLED = 'true';
process.env.BANK_NAME = 'Test Bank';
process.env.BANK_ACCOUNT_NAME = 'Test Store';
process.env.BANK_ACCOUNT_NUMBER = '0000000000';

const [
  { default: ordersRouter },
  { default: listingsRouter },
  { default: paymentsRouter },
  { sequelize },
  { Order },
  { Listing },
  { hashOrderAccessToken },
] =
  await Promise.all([
    import('./orders.js'),
    import('./listings.js'),
    import('./payments.js'),
    import('../models/index.js'),
    import('../models/Order.js'),
    import('../models/Listing.js'),
    import('../utils/orderAccess.js'),
  ]);

test('protects customer order reads and admin listing moderation', async (context) => {
  const originalWorkingDirectory = process.cwd();
  const testDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'ecommerce-api-test-'));
  let server;
  context.after(async () => {
    try {
      if (server) {
        await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
      }
      await sequelize.close();
    } finally {
      process.chdir(originalWorkingDirectory);
      fs.rmSync(testDirectory, { recursive: true, force: true });
    }
  });
  process.chdir(testDirectory);
  await sequelize.sync({ force: true });

  const customerToken = 'customer-session-token';
  const otherCustomerToken = 'another-customer-token';
  const order = await Order.create({
    orderTimeMs: Date.now(),
    totalCostCents: 5000,
    products: [],
    shippingAddress: { fullName: 'Private Customer', addressLine1: 'Private Address' },
    customerAccessTokenHash: hashOrderAccessToken(customerToken),
  });

  await Listing.create({
    id: 'existing-approved',
    status: 'approved',
    data: { productName: 'Public listing', ownerEmail: 'seller@example.com' },
  });
  await Listing.create({
    id: 'pending-listing',
    status: 'pending',
    data: { productName: 'Pending listing', ownerEmail: 'seller@example.com' },
  });

  const app = express();
  app.use(express.json());
  app.use('/api/orders', ordersRouter);
  app.use('/api/listings', listingsRouter);
  app.use('/api/payments', paymentsRouter);
  server = app.listen(0);
  await new Promise((resolve) => server.once('listening', resolve));

  const baseUrl = `http://127.0.0.1:${server.address().port}`;
  const paymentMethodsResponse = await fetch(`${baseUrl}/api/payments/methods`);
  const paymentMethods = await paymentMethodsResponse.json();
  assert.equal(paymentMethods.paystack.enabled, false);
  assert.equal(paymentMethods.paystack.available, true);
  assert.equal(paymentMethods.pay_on_delivery.enabled, true);
  assert.equal(paymentMethods.bank_transfer.enabled, true);
  assert.equal(paymentMethods.bank_transfer.account.bankName, 'Test Bank');

  const paystackOrderResponse = await fetch(`${baseUrl}/api/orders`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-order-access-token': 'new-customer-token',
    },
    body: JSON.stringify({
      paymentMethod: 'paystack',
      shippingAddress: {
        fullName: 'Test Customer',
        email: 'customer@example.com',
        phone: '08012345678',
        addressLine1: 'Test Street',
        city: 'Ikeja',
        state: 'Lagos',
      },
    }),
  });
  assert.equal(paystackOrderResponse.status, 400);
  assert.match((await paystackOrderResponse.json()).error, /not available/i);

  const unauthorizedOrders = await fetch(`${baseUrl}/api/orders`);
  assert.equal(unauthorizedOrders.status, 401);
  const invalidAdminOrders = await fetch(`${baseUrl}/api/orders`, {
    headers: { 'x-admin-key': 'wrong-admin-key' },
  });
  assert.equal(invalidAdminOrders.status, 401);
  const adminOrders = await fetch(`${baseUrl}/api/orders`, {
    headers: { 'x-admin-key': process.env.ADMIN_API_KEY },
  });
  assert.equal(adminOrders.status, 200);
  assert.equal('customerAccessTokenHash' in (await adminOrders.json())[0], false);

  const customerOrders = await fetch(`${baseUrl}/api/orders`, {
    headers: { 'x-order-access-token': customerToken },
  });
  assert.equal(customerOrders.status, 200);
  const customerPayload = await customerOrders.json();
  assert.equal(customerPayload.length, 1);
  assert.equal(customerPayload[0].id, order.id);
  assert.equal('customerAccessTokenHash' in customerPayload[0], false);

  const otherCustomerOrder = await fetch(`${baseUrl}/api/orders/${order.id}`, {
    headers: { 'x-order-access-token': otherCustomerToken },
  });
  assert.equal(otherCustomerOrder.status, 404);
  const customerOrder = await fetch(`${baseUrl}/api/orders/${order.id}`, {
    headers: { 'x-order-access-token': customerToken },
  });
  assert.equal(customerOrder.status, 200);
  const customerOrderPayload = await customerOrder.json();
  assert.equal(customerOrderPayload.shippingAddress.fullName, 'Private Customer');
  assert.equal('customerAccessTokenHash' in customerOrderPayload, false);

  const publicListings = await fetch(`${baseUrl}/api/listings`);
  assert.equal(publicListings.status, 200);
  const publicListingPayload = await publicListings.json();
  assert.deepEqual(publicListingPayload.map((listing) => listing.id), ['existing-approved']);
  assert.equal('ownerEmail' in publicListingPayload[0], false);

  const pendingAsPublic = await fetch(`${baseUrl}/api/listings/pending-listing`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status: 'rejected' }),
  });
  assert.equal(pendingAsPublic.status, 401);

  const adminListings = await fetch(`${baseUrl}/api/listings`, {
    headers: { 'x-admin-key': process.env.ADMIN_API_KEY },
  });
  assert.equal(adminListings.status, 200);
  assert.equal((await adminListings.json()).length, 2);
  const authorizedDecision = await fetch(`${baseUrl}/api/listings/pending-listing`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'x-admin-key': process.env.ADMIN_API_KEY,
    },
    body: JSON.stringify({ status: 'rejected' }),
  });
  assert.equal(authorizedDecision.status, 200);
  assert.equal((await authorizedDecision.json()).status, 'rejected');

  const submittedListing = await fetch(`${baseUrl}/api/listings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      id: 'new-listing',
      productName: 'New listing',
      status: 'approved',
      category: 'Appliances',
      imageDataUrl: 'data:image/jpeg;base64,AA==',
    }),
  });
  assert.equal(submittedListing.status, 201);
  assert.equal((await submittedListing.json()).status, 'pending');
});
