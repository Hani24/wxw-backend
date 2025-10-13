'use strict';

const { DataTypes } = require('sequelize');

module.exports = {
  up: async(queryInterface, Sequelize) => {

    await Promise.all([
      queryInterface.removeColumn('Restaurants', 'lat'),
      queryInterface.removeColumn('Restaurants', 'lon'),
      queryInterface.removeColumn('Couriers', 'lat'),
      queryInterface.removeColumn('Couriers', 'lon'),
      queryInterface.removeColumn('Users', 'lat'),
      queryInterface.removeColumn('Users', 'lon'),
    ]);

    return Promise.all([
      queryInterface.addColumn('Restaurants', 'lat', {
        type: DataTypes.DECIMAL(3+8,8), allowNull: false, defaultValue: 0,
      }),
      queryInterface.addColumn('Restaurants', 'lon', {
        type: DataTypes.DECIMAL(3+8,8), allowNull: false, defaultValue: 0,
      }),
      queryInterface.addColumn('Couriers', 'lat', {
        type: DataTypes.DECIMAL(3+8,8), allowNull: false, defaultValue: 0,
      }),
      queryInterface.addColumn('Couriers', 'lon', {
        type: DataTypes.DECIMAL(3+8,8), allowNull: false, defaultValue: 0,
      }),
      queryInterface.addColumn('Users', 'lat', {
        type: DataTypes.DECIMAL(3+8,8), allowNull: false, defaultValue: 0,
      }),
      queryInterface.addColumn('Users', 'lon', {
        type: DataTypes.DECIMAL(3+8,8), allowNull: false, defaultValue: 0,
      }),
    ]);
  },
  down: async(queryInterface, Sequelize) => {

    await Promise.all([
      queryInterface.removeColumn('Restaurants', 'lat'),
      queryInterface.removeColumn('Restaurants', 'lon'),
      queryInterface.removeColumn('Couriers', 'lat'),
      queryInterface.removeColumn('Couriers', 'lon'),
      queryInterface.removeColumn('Users', 'lat'),
      queryInterface.removeColumn('Users', 'lon'),
    ]);

    return Promise.all([
      queryInterface.addColumn('Restaurants', 'lat', {
        type: DataTypes.FLOAT, allowNull: true, defaultValue: 0,
      }),
      queryInterface.addColumn('Restaurants', 'lon', {
        type: DataTypes.FLOAT, allowNull: true, defaultValue: 0,
      }),
      queryInterface.addColumn('Couriers', 'lat', {
        type: DataTypes.FLOAT, allowNull: true, defaultValue: 0,
      }),
      queryInterface.addColumn('Couriers', 'lon', {
        type: DataTypes.FLOAT, allowNull: true, defaultValue: 0,
      }),
      queryInterface.addColumn('Users', 'lat', {
        type: DataTypes.STRING, allowNull: true, defaultValue: 0,
      }),
      queryInterface.addColumn('Users', 'lon', {
        type: DataTypes.STRING, allowNull: true, defaultValue: 0,
      }),
    ]);
  }
};
