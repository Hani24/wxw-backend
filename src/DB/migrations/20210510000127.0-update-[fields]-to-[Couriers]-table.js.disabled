'use strict';

const { DataTypes } = require('sequelize');

module.exports = {
  up: (queryInterface, Sequelize) => {
    return Promise.all([
      // [statistic]
      queryInterface.addColumn('Couriers', 'totalIncome', {
        type: DataTypes.DECIMAL(8,2).UNSIGNED, allowNull: true, defaultValue: 0
      }),
      queryInterface.addColumn('Couriers', 'totalOrders', {
        type: DataTypes.BIGINT(8).UNSIGNED, allowNull: true, defaultValue: 0,
      }),
      queryInterface.addColumn('Couriers', 'totalAcceptedOrders', {
        type: DataTypes.BIGINT(8).UNSIGNED, allowNull: true, defaultValue: 0,
      }),
      queryInterface.addColumn('Couriers', 'totalRejectedOrders', {
        type: DataTypes.BIGINT(8).UNSIGNED, allowNull: true, defaultValue: 0,
      }),
      queryInterface.addColumn('Couriers', 'totalCanceledOrders', {
        type: DataTypes.BIGINT(8).UNSIGNED, allowNull: true, defaultValue: 0,
      }),
      queryInterface.addColumn('Couriers', 'totalRating', {
        type: DataTypes.BIGINT(8).UNSIGNED, allowNull: true, defaultValue: 0,
      }),
    ]);
  },
  down: (queryInterface, Sequelize) => {
    return Promise.all([
      queryInterface.removeColumn('Couriers', 'totalIncome'),
      queryInterface.removeColumn('Couriers', 'totalOrders'),
      queryInterface.removeColumn('Couriers', 'totalAcceptedOrders'),
      queryInterface.removeColumn('Couriers', 'totalRejectedOrders'),
      queryInterface.removeColumn('Couriers', 'totalCanceledOrders'),
      queryInterface.removeColumn('Couriers', 'totalRating'),
    ]);
  }
};
