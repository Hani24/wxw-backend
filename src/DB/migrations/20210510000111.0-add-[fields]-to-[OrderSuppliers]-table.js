'use strict';

const { DataTypes } = require('sequelize');

module.exports = {
  up: (queryInterface, Sequelize) => {
    return Promise.all([
      queryInterface.addColumn('OrderSuppliers', 'isCourierArrived', {
        type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false
      }),
      queryInterface.addColumn('OrderSuppliers', 'courierArrivedAt', {
        type: DataTypes.DATE, allowNull: true, defaultValue: null
      }),
    ]);
  },
  down: (queryInterface, Sequelize) => {
    return Promise.all([
      queryInterface.removeColumn('OrderSuppliers', 'isCourierArrived'),
      queryInterface.removeColumn('OrderSuppliers', 'courierArrivedAt'),
    ]);
  }
};
