'use strict';

const { DataTypes } = require('sequelize');

module.exports = {
  up: (queryInterface, Sequelize) => {
    return Promise.all([
      queryInterface.removeColumn('DeliveryAddresses', 'floor'),
      queryInterface.removeColumn('DeliveryAddresses', 'porch'),
    ]);
  },
  down: (queryInterface, Sequelize) => {
    return Promise.all([
      queryInterface.addColumn('DeliveryAddresses', 'floor', {
        type: DataTypes.STRING, allowNull: true, defaultValue: '',
      }),
      queryInterface.addColumn('DeliveryAddresses', 'porch', {
        type: DataTypes.STRING, allowNull: true, defaultValue: '',
      }),
    ]);
  }
};
