'use strict';

const { DataTypes } = require('sequelize');
const ORDER_TYPES = require('../dicts/ORDER_TYPES');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // For MySQL/MariaDB: Alter the enum to include 'catering'
    // This migration ensures existing databases get the new 'catering' order type

    return queryInterface.sequelize.query(`
      ALTER TABLE Orders
      MODIFY COLUMN orderType ENUM('order-now', 'on-site-presence', 'catering')
      NOT NULL DEFAULT 'order-now';
    `);
  },

  down: async (queryInterface, Sequelize) => {
    // Remove 'catering' from enum (only safe if no catering orders exist)
    return queryInterface.sequelize.query(`
      ALTER TABLE Orders
      MODIFY COLUMN orderType ENUM('order-now', 'on-site-presence')
      NOT NULL DEFAULT 'order-now';
    `);
  }
};
