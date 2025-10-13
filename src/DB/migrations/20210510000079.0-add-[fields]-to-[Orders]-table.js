'use strict';

const { DataTypes } = require('sequelize');

const DISTANCE_UNITS = require('../dicts/DISTANCE_UNITS');

module.exports = {
  up: (queryInterface, Sequelize) => {
    return Promise.all([
      queryInterface.addColumn('Orders', 'deliveryPrice', {
        type: DataTypes.DECIMAL(8,2).UNSIGNED, allowNull: false, defaultValue: 0      
      }),
      queryInterface.addColumn('Orders', 'deliveryPriceUnitPrice', {
        type: DataTypes.DECIMAL(8,2).UNSIGNED, allowNull: false, defaultValue: 0
      }),
      queryInterface.addColumn('Orders', 'deliveryPriceUnitType', {
        type: DataTypes.ENUM, required: true, values: DISTANCE_UNITS,
        defaultValue: DISTANCE_UNITS[ 0 ],
      }),
    ]);
  },
  down: (queryInterface, Sequelize) => {
    return Promise.all([
      queryInterface.removeColumn('Orders', 'deliveryPrice'),
      queryInterface.removeColumn('Orders', 'deliveryPriceUnitPrice'),
      queryInterface.removeColumn('Orders', 'deliveryPriceUnitType'),
    ]);
  }
};
