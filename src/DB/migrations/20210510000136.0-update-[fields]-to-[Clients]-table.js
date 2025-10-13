'use strict';

const { DataTypes } = require('sequelize');

module.exports = {
  up: (queryInterface, Sequelize) => {
    return Promise.all([
      // [statistic]
      queryInterface.addColumn('Clients', 'totalSpend', {
        type: DataTypes.DECIMAL(8,2).UNSIGNED, allowNull: true, defaultValue: 0
      }),
      queryInterface.addColumn('Clients', 'totalOrders', {
        type: DataTypes.BIGINT(8).UNSIGNED, allowNull: true, defaultValue: 0,
      }),
      queryInterface.addColumn('Clients', 'totalRejectedOrders', {
        type: DataTypes.BIGINT(8).UNSIGNED, allowNull: true, defaultValue: 0,
      }),
      queryInterface.addColumn('Clients', 'totalCanceledOrders', {
        type: DataTypes.BIGINT(8).UNSIGNED, allowNull: true, defaultValue: 0,
      }),
      queryInterface.addColumn('Clients', 'totalCompletedOrders', {
        type: DataTypes.BIGINT(8).UNSIGNED, allowNull: true, defaultValue: 0,
      }),
    ]);
  },
  down: (queryInterface, Sequelize) => {
    return Promise.all([
      queryInterface.removeColumn('Clients', 'totalSpend'),
      queryInterface.removeColumn('Clients', 'totalOrders'),
      queryInterface.removeColumn('Clients', 'totalRejectedOrders'),
      queryInterface.removeColumn('Clients', 'totalCanceledOrders'),
      queryInterface.removeColumn('Clients', 'totalCompletedOrders'),
    ]);
  }
};
