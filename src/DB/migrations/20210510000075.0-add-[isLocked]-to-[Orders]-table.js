'use strict';

const { DataTypes } = require('sequelize');

module.exports = {
  up: (queryInterface, Sequelize) => {
    return Promise.all([
      queryInterface.addColumn('Orders', 'isLocked', {
        type: DataTypes.BOOLEAN, allowNull: true, defaultValue: false
      }),
      queryInterface.addColumn('Orders', 'lockedAt', {
        type: DataTypes.DATE, allowNull: true, defaultValue: null
      }),
    ]);
  },
  down: (queryInterface, Sequelize) => {
    return Promise.all([
      queryInterface.removeColumn('Orders', 'isLocked'),
      queryInterface.removeColumn('Orders', 'lockedAt'),
    ]);
  }
};
