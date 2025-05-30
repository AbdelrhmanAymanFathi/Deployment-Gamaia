const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Association = sequelize.define('Association', {
  name: { type: DataTypes.STRING, allowNull: false },
  description: DataTypes.TEXT,
  monthlyAmount: { type: DataTypes.FLOAT, allowNull: false },
  status: {
    type: DataTypes.ENUM('active', 'completed', 'pending'),
    defaultValue: 'active'
  },
  startDate: { type: DataTypes.DATE, allowNull: false },
  duration: { type: DataTypes.INTEGER }, // عدد الأشهر
  type: {
    type: DataTypes.ENUM('A', 'B'),
    allowNull: false,
    defaultValue: 'B'
  }
});

const UserAssociation = sequelize.define('UserAssociation', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  joinDate: DataTypes.DATE,
  status: {
    type: DataTypes.ENUM('active', 'completed', 'suspended'),
    defaultValue: 'active'
  },
  remainingAmount: DataTypes.FLOAT,
  hasReceived: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  lastReceivedDate: DataTypes.DATE,
  turnNumber: DataTypes.INTEGER
});

module.exports = { Association, UserAssociation };