import { DataTypes } from 'sequelize';
import { sequelize } from './index.js';

export const Order = sequelize.define('Order', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  orderTimeMs: {
    type: DataTypes.BIGINT,
    allowNull: false
  },
  totalCostCents: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  products: {
    type: DataTypes.JSON,
    allowNull: false
  },
  shippingAddress: {
    type: DataTypes.JSON,
    allowNull: true
  },
  // placed | cancelled | refunded
  status: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'placed'
  },
  // paystack | bank_transfer | pay_on_delivery | legacy (orders placed before payments existed)
  paymentMethod: {
    type: DataTypes.STRING,
    allowNull: true
  },
  // pending | paid | failed | expired | cancelled | partially_refunded | refunded
  paymentStatus: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'pending'
  },
  paymentReference: {
    type: DataTypes.STRING,
    allowNull: true
  },
  paidAtMs: {
    type: DataTypes.BIGINT,
    allowNull: true
  },
  refundedCents: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  },
  // [{ id, amountCents, reason, status, method, createdAtMs, providerRef }]
  refunds: {
    type: DataTypes.JSON,
    allowNull: true
  },
  // Audit trail of payment events: [{ atMs, event, detail }]
  paymentLog: {
    type: DataTypes.JSON,
    allowNull: true
  },
  // Set once reserved stock has been returned, so it can never be restored twice.
  stockReleased: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  // Lets a retried "place order" request return the original order instead of creating a duplicate.
  idempotencyKey: {
    type: DataTypes.STRING,
    allowNull: true
  },
  createdAt: {
    type: DataTypes.DATE(3)
  },
  updatedAt: {
    type: DataTypes.DATE(3)
  },
}, {
  defaultScope: {
    order: [['createdAt', 'ASC']]
  }
});
