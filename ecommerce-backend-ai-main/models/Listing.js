import { DataTypes } from 'sequelize';
import { sequelize } from './index.js';

// Seller listings are stored as a JSON payload so the frontend shape is preserved.
export const Listing = sequelize.define('Listing', {
  id: {
    type: DataTypes.STRING,
    primaryKey: true
  },
  status: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'pending'
  },
  data: {
    type: DataTypes.JSON,
    allowNull: false
  }
});
