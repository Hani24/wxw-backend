'use strict';

const { DataTypes } = require('sequelize');

module.exports = {
  up: (queryInterface, Sequelize) => {
    return Promise.all([
      queryInterface.addColumn('Restaurants', 'totalAcceptedOrders', {
        type: DataTypes.BIGINT(8).UNSIGNED, allowNull: false, defaultValue: 0,
      }),
      queryInterface.addColumn('Restaurants', 'totalCanceledOrders', {
        type: DataTypes.BIGINT(8).UNSIGNED, allowNull: false, defaultValue: 0,
      }),
    ]);
  },
  down: (queryInterface, Sequelize) => {
    return Promise.all([
      queryInterface.removeColumn('Restaurants', 'totalAcceptedOrders'),
      queryInterface.removeColumn('Restaurants', 'totalCanceledOrders'),
    ]);
  }
};
