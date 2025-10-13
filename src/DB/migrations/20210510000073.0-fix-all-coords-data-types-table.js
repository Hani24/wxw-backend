'use strict';

const { DataTypes } = require('sequelize');

module.exports = {
  up: (queryInterface, Sequelize) => {
    return Promise.all([

      queryInterface.sequelize.query(`update Clients set lat=0, lon=0`),
      queryInterface.changeColumn('Clients', 'lat', {
        type: DataTypes.FLOAT, allowNull: true, defaultValue: 0,
      }),
      queryInterface.changeColumn('Clients', 'lon', {
        type: DataTypes.FLOAT, allowNull: true, defaultValue: 0,
      }),

      queryInterface.sequelize.query(`update Couriers set lat=0, lon=0`),
      queryInterface.changeColumn('Couriers', 'lat', {
        type: DataTypes.FLOAT, allowNull: true, defaultValue: 0,
      }),
      queryInterface.changeColumn('Couriers', 'lon', {
        type: DataTypes.FLOAT, allowNull: true, defaultValue: 0,
      }),

      queryInterface.sequelize.query(`update Restaurants set lat=0, lon=0`),
      queryInterface.changeColumn('Restaurants', 'lat', {
        type: DataTypes.FLOAT, allowNull: true, defaultValue: 0,
      }),
      queryInterface.changeColumn('Restaurants', 'lon', {
        type: DataTypes.FLOAT, allowNull: true, defaultValue: 0,
      }),

      queryInterface.sequelize.query(`update DeliveryAddresses set lat=0, lon=0`),
      queryInterface.changeColumn('DeliveryAddresses', 'lat', {
        type: DataTypes.FLOAT, allowNull: true, defaultValue: 0,
      }),
      queryInterface.changeColumn('DeliveryAddresses', 'lon', {
        type: DataTypes.FLOAT, allowNull: true, defaultValue: 0,
      }),

    ]);
  },
  down: (queryInterface, Sequelize) => {
    return Promise.all([]);
  }
};
