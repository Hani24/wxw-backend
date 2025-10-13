'use strict';

const { DataTypes } = require('sequelize');

module.exports = {
  up: (queryInterface, Sequelize) => {
    return Promise.all([
      queryInterface.addColumn('Restaurants', 'totalIncomeInCent', {
        type: DataTypes.BIGINT(8).UNSIGNED, allowNull: false, defaultValue: 0,
      }),
      queryInterface.addColumn('Restaurants', 'totalOrders', {
        type: DataTypes.BIGINT(8).UNSIGNED, allowNull: false, defaultValue: 0,
      }),
      queryInterface.addColumn('Restaurants', 'totalPreparationTimeInSeconds', {
        type: DataTypes.BIGINT(8).UNSIGNED, allowNull: false, defaultValue: 0,
      }),
    ]);
  },
  down: (queryInterface, Sequelize) => {
    return Promise.all([
      queryInterface.removeColumn('Restaurants', 'totalIncomeInCent'),
      queryInterface.removeColumn('Restaurants', 'totalOrders'),
      queryInterface.removeColumn('Restaurants', 'totalPreparationTimeInSeconds'),
    ]);
  }
};
