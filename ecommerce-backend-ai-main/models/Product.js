import { DataTypes } from 'sequelize';
import { sequelize } from './index.js';

export const Product = sequelize.define('Product', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  image: {
    type: DataTypes.STRING,
    allowNull: false
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  rating: {
    type: DataTypes.JSON,
    allowNull: false
  },
  priceCents: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  keywords: {
    type: DataTypes.STRING,
    allowNull: false,
    get() {
      return this.getDataValue('keywords').split(',');
    },
    set(val) {
      this.setDataValue('keywords', val.join(','));
    }
  },
  ownerEmail: {
    type: DataTypes.STRING,
    allowNull: true
  },
  // Seller-provided listing details (category, condition, description, seller, phone specs, ...).
  details: {
    type: DataTypes.JSON,
    allowNull: true
  },
  // Remaining stock per size, e.g. { "M": 4, "L": 0 }. Null for products that are not sold by size.
  sizeStock: {
    type: DataTypes.JSON,
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
