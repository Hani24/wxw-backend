'use strict';

const { DataTypes } = require('sequelize');

module.exports = {
  up: (queryInterface, Sequelize) => {

    return Promise.all([
      queryInterface.addColumn('Orders', 'isCanceledByClient', {
        type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false
      }),
      queryInterface.addColumn('Orders', 'canceledByClientAt', {
        type: DataTypes.DATE, allowNull: true, defaultValue: null
      }),
      queryInterface.addColumn('Orders', 'cancellationReason', {
        type: DataTypes.TEXT, allowNull: false, defaultValue: ''
      }),
    ]);
  },
  down: (queryInterface, Sequelize) => {
    return Promise.all([
      queryInterface.removeColumn('Orders', 'isCanceledByClient'),
      queryInterface.removeColumn('Orders', 'canceledByClientAt'),
      queryInterface.removeColumn('Orders', 'cancellationReason'),
    ]);
  }
};
