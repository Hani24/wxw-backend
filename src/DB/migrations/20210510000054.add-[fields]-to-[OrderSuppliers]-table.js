'use strict';

const { DataTypes } = require('sequelize');

module.exports = {
  up: (queryInterface, Sequelize) => {
    return Promise.all([
      queryInterface.addColumn('OrderSuppliers', 'isAcceptedByRestaurant', {
        type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false
      }),
      queryInterface.addColumn('OrderSuppliers', 'acceptedByRestaurantAt', {
        type: DataTypes.DATE, allowNull: true, defaultValue: null
      }),
      queryInterface.addColumn('OrderSuppliers', 'isOrderReady', {
        type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false
      }),
      queryInterface.addColumn('OrderSuppliers', 'orderReadyAt', {
        type: DataTypes.DATE, allowNull: true, defaultValue: null
      }),
    ]);
  },
  down: (queryInterface, Sequelize) => {
    return Promise.all([
      queryInterface.removeColumn('OrderSuppliers', 'isAcceptedByRestaurant'),
      queryInterface.removeColumn('OrderSuppliers', 'acceptedByRestaurantAt'),
      queryInterface.removeColumn('OrderSuppliers', 'isOrderReady'),
      queryInterface.removeColumn('OrderSuppliers', 'orderReadyAt'),
    ]);
  }
};
