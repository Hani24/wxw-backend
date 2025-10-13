'use strict';

const { DataTypes } = require('sequelize');

module.exports = {
  up: (queryInterface, Sequelize) => {
    return Promise.all([
      queryInterface.removeColumn('DeliveryPriceSettings', 'maxSearchSquareInKilometers'),
      queryInterface.addColumn('DeliveryPriceSettings', 'maxSearchRadius', {
        type: DataTypes.FLOAT.UNSIGNED, allowNull: true, defaultValue: 15.0,
      }),
    ]);
  },
  down: (queryInterface, Sequelize) => {
    return Promise.all([
      queryInterface.removeColumn('DeliveryPriceSettings', 'maxSearchRadius'),
      queryInterface.addColumn('DeliveryPriceSettings', 'maxSearchSquareInKilometers', {
        type: DataTypes.FLOAT.UNSIGNED, allowNull: true, defaultValue: 15.0,
      }),
    ]);
  }
};
