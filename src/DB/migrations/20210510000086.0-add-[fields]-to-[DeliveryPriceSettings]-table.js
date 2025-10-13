'use strict';

const { DataTypes } = require('sequelize');

module.exports = {
  up: (queryInterface, Sequelize) => {
    return Promise.all([
      queryInterface.addColumn('DeliveryPriceSettings', 'maxSearchSquareInDegrees', {
        type: DataTypes.FLOAT.UNSIGNED, allowNull: true, defaultValue: 0.1,
      }),
      queryInterface.addColumn('DeliveryPriceSettings', 'maxSearchSquareInKilometers', {
        type: DataTypes.FLOAT.UNSIGNED, allowNull: true, defaultValue: 15.0,
      }),
    ]);
  },
  down: (queryInterface, Sequelize) => {
    return Promise.all([
      queryInterface.removeColumn('DeliveryPriceSettings', 'maxSearchSquareInDegrees'),
      queryInterface.removeColumn('DeliveryPriceSettings', 'maxSearchSquareInKilometers'),
    ]);
  }
};
