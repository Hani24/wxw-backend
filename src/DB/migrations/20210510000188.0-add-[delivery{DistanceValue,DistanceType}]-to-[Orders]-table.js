'use strict';

const { DataTypes } = require('sequelize');

module.exports = {
  up: (queryInterface, Sequelize) => {
    return Promise.all([
      queryInterface.addColumn('Orders', 'deliveryDistanceValue', {
        type: DataTypes.FLOAT.UNSIGNED, allowNull: false, defaultValue: 0      
      }),
      queryInterface.addColumn('Orders', 'deliveryDistanceType', {
        type: DataTypes.STRING, allowNull: false, defaultValue: '',
      }),
    ]);
  },
  down: (queryInterface, Sequelize) => {
    return Promise.all([
      queryInterface.removeColumn('Orders', 'deliveryDistanceValue'),
      queryInterface.removeColumn('Orders', 'deliveryDistanceType'),
    ]);
  }
};
