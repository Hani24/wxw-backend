'use strict';

const { DataTypes } = require('sequelize');

module.exports = {
  up: (queryInterface, Sequelize) => {
    return Promise.all([
      // [inner]:[flags]:[payments]
      queryInterface.addColumn('OrderSuppliers', 'isAppliedToBalance', {
        type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false
      }),
      queryInterface.addColumn('OrderSuppliers', 'appliedToBalanceAt', {
        type: DataTypes.DATE, allowNull: true, defaultValue: null
      }),
    ]);
  },
  down: (queryInterface, Sequelize) => {
    return Promise.all([
      queryInterface.removeColumn('OrderSuppliers', 'isAppliedToBalance'),
      queryInterface.removeColumn('OrderSuppliers', 'appliedToBalanceAt'),
    ]);
  }
};

