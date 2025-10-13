'use strict';

const { DataTypes } = require('sequelize');

module.exports = {
  up: (queryInterface, Sequelize) => {
    return Promise.all([
      queryInterface.addColumn('Orders', 'isClientActionRequired', {
        type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false
      }),
      queryInterface.addColumn('Orders', 'clientActionRequiredAt', {
        type: DataTypes.DATE, allowNull: true, defaultValue: null
      }),
      queryInterface.addColumn('Orders', 'isClientActionExecuted', {
        type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false
      }),
      queryInterface.addColumn('Orders', 'clientActionExecutedAt', {
        type: DataTypes.DATE, allowNull: true, defaultValue: null
      }),
    ]);
  },
  down: (queryInterface, Sequelize) => {
    return Promise.all([
      queryInterface.removeColumn('Orders', 'isClientActionRequired'),
      queryInterface.removeColumn('Orders', 'clientActionRequiredAt'),
      queryInterface.removeColumn('Orders', 'isClientActionExecuted'),
      queryInterface.removeColumn('Orders', 'clientActionExecutedAt'),
    ]);
  }
};
