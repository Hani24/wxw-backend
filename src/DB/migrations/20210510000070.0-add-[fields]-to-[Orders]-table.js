'use strict';

const { DataTypes } = require('sequelize');

module.exports = {
  up: (queryInterface, Sequelize) => {
    return Promise.all([
      queryInterface.addColumn('Orders', 'allSuppliersHaveConfirmed', {
        type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false
      }),
      queryInterface.addColumn('Orders', 'allSuppliersHaveConfirmedAt', {
        type: DataTypes.DATE, allowNull: true, defaultValue: null
      }),
    ]);
  },
  down: (queryInterface, Sequelize) => {
    return Promise.all([
      queryInterface.removeColumn('Orders', 'allSuppliersHaveConfirmed'),
      queryInterface.removeColumn('Orders', 'allSuppliersHaveConfirmedAt'),
    ]);
  }
};
