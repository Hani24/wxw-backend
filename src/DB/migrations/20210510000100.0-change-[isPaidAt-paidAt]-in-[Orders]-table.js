'use strict';

const { DataTypes } = require('sequelize');

module.exports = {
  up: (queryInterface, Sequelize) => {
    return Promise.all([
      queryInterface.removeColumn('Orders', 'isPaidAt'),
      queryInterface.addColumn('Orders', 'paidAt', {
        type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false
      }),
    ]);
  },
  down: (queryInterface, Sequelize) => {
    return Promise.all([
      queryInterface.removeColumn('Orders', 'paidAt'),
      queryInterface.addColumn('Orders', 'isPaidAt', {
        type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false
      }),
    ]);
  }
};
