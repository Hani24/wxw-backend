'use strict';

const { DataTypes } = require('sequelize');
// const ORDER_STATUSES = require('../dicts/ORDER_STATUSES');

module.exports = {
  up: (queryInterface, Sequelize) => {
    return Promise.all([
      // [inner][orders][delayed]
      queryInterface.addColumn('Orders', 'isPushedToProcessing', {
        type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false
      }),
      queryInterface.addColumn('Orders', 'pushedToProcessingAt', {
        type: DataTypes.DATE, allowNull: true, defaultValue: null
      }),
      queryInterface.addColumn('Orders', 'pushToProcessingAt', {
        type: DataTypes.DATE, allowNull: true, defaultValue: null
      }),
    ]);
  },
  down: (queryInterface, Sequelize) => {
    return Promise.all([
      queryInterface.removeColumn('Orders', 'isPushedToProcessing'),
      queryInterface.removeColumn('Orders', 'pushedToProcessingAt'),
      queryInterface.removeColumn('Orders', 'pushToProcessingAt'),
    ]);
  }
};
