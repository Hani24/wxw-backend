'use strict';

const { DataTypes } = require('sequelize');

module.exports = {
  up: (queryInterface, Sequelize) => {
    return Promise.all([
      queryInterface.addColumn('DeliveryPriceSettings', 'serviceFeePercent', {
        type: DataTypes.FLOAT.UNSIGNED, allowNull: true, defaultValue: 15.0,
      }),
      queryInterface.addColumn('DeliveryPriceSettings', 'deliveryPerUnitFeePercent', {
        type: DataTypes.FLOAT.UNSIGNED, allowNull: true, defaultValue: 2.0,
      }),
    ]);
  },
  down: (queryInterface, Sequelize) => {
    return Promise.all([
      queryInterface.removeColumn('DeliveryPriceSettings', 'serviceFeePercent'),
      queryInterface.removeColumn('DeliveryPriceSettings', 'deliveryPerUnitFeePercent'),
    ]);
  }
};
