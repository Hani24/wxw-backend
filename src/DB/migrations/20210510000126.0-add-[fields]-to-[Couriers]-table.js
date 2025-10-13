'use strict';

const { DataTypes } = require('sequelize');

module.exports = {
  up: (queryInterface, Sequelize) => {
    return Promise.all([
      // [statistic]
      queryInterface.addColumn('Couriers', 'totalCompletedOrders', {
        type: DataTypes.BIGINT(8).UNSIGNED, allowNull: false, defaultValue: 0,
      }),
    ]);
  },
  down: (queryInterface, Sequelize) => {
    return Promise.all([
      queryInterface.removeColumn('Couriers', 'totalCompletedOrders'),
    ]);
  }
};
