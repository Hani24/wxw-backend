'use strict';

const { DataTypes } = require('sequelize');

module.exports = {
  up: (queryInterface, Sequelize) => {
    return Promise.all([
      queryInterface.addColumn('OrderSuppliers', 'isRequestCreated', {
        type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false
      }),
      queryInterface.addColumn('OrderSuppliers', 'requestCreatedAt', {
        type: DataTypes.DATE, allowNull: true, defaultValue: null
      }),
    ]);
  },
  down: (queryInterface, Sequelize) => {
    return Promise.all([
      queryInterface.removeColumn('OrderSuppliers', 'isRequestCreated'),
      queryInterface.removeColumn('OrderSuppliers', 'requestCreatedAt'),
    ]);
  }
};
