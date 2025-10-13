'use strict';

const { DataTypes } = require('sequelize');

module.exports = {
  up: (queryInterface, Sequelize) => {
    return Promise.all([
      queryInterface.addColumn('DeliveryPriceSettings', 'baseFee', {
        type: DataTypes.FLOAT.UNSIGNED, allowNull: false, defaultValue: 3.99,
      }),
    ]);
  },
  down: (queryInterface, Sequelize) => {
    return Promise.all([
      queryInterface.removeColumn('DeliveryPriceSettings', 'baseFee'),
    ]);
  }
};
