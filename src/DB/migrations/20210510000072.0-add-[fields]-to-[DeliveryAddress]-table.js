'use strict';

const { DataTypes } = require('sequelize');

module.exports = {
  up: (queryInterface, Sequelize) => {
    return Promise.all([
      queryInterface.addColumn('DeliveryAddresses', 'lat', {
        type: DataTypes.STRING, allowNull: true, defaultValue: '',
      }),
      queryInterface.addColumn('DeliveryAddresses', 'lon', {
        type: DataTypes.STRING, allowNull: true, defaultValue: '',
      }),
    ]);
  },
  down: (queryInterface, Sequelize) => {
    return Promise.all([
      queryInterface.removeColumn('DeliveryAddresses','lat'),
      queryInterface.removeColumn('DeliveryAddresses','lon'),
    ]);
  }
};
