'use strict';

const { DataTypes } = require('sequelize');
const ORDER_TYPES = require('../dicts/ORDER_TYPES');

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.addColumn('Orders', 'orderType', {
      type: DataTypes.ENUM,
      values: ORDER_TYPES,
      allowNull: false,
      defaultValue: ORDER_TYPES[0], // 'order-now'
      after: 'status', // Add after status field
    }).then(() => {
      // Add index for faster queries by order type
      return queryInterface.addIndex('Orders', {
        fields: ['orderType'],
        name: 'idx_order_type'
      });
    });
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.removeColumn('Orders', 'orderType');
  }
};
