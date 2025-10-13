'use strict';

const { DataTypes } = require('sequelize');

module.exports = {
  up: (queryInterface, Sequelize) => {
    return Promise.all([
      queryInterface.addColumn('OrderSuppliers', 'isOrderDelayed', {
        type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false
      }),
      queryInterface.addColumn('OrderSuppliers', 'orderDelayedFor', {
        type: DataTypes.INTEGER.UNSIGNED, allowNull: true, defaultValue: 0
      }),
    ]);
  },
  down: (queryInterface, Sequelize) => {
    return Promise.all([
      queryInterface.removeColumn('OrderSuppliers', 'isOrderDelayed'),
      queryInterface.removeColumn('OrderSuppliers', 'orderDelayedFor'),
    ]);
  }
};
