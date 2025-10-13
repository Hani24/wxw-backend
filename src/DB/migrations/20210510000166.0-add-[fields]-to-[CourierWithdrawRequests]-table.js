'use strict';

const { DataTypes } = require('sequelize');

module.exports = {
  up: (queryInterface, Sequelize) => {
    return Promise.all([
      queryInterface.addColumn('CourierWithdrawRequests', 'isInitialized', {
        type: DataTypes.BOOLEAN, allowNull: true, defaultValue: false
      }),
      queryInterface.addColumn('CourierWithdrawRequests', 'initializedAt', {
        type: DataTypes.DATE, allowNull: true, defaultValue: null
      }),
      queryInterface.addColumn('CourierWithdrawRequests', 'transferId', {
        type: DataTypes.STRING, allowNull: true, defaultValue: null,
      }),
      queryInterface.addColumn('CourierWithdrawRequests', 'payoutId', {
        type: DataTypes.STRING, allowNull: true, defaultValue: null,
      }),
    ]);
  },
  down: (queryInterface, Sequelize) => {
    return Promise.all([
      queryInterface.removeColumn('CourierWithdrawRequests', 'transferId'),
      queryInterface.removeColumn('CourierWithdrawRequests', 'payoutId'),
      queryInterface.removeColumn('CourierWithdrawRequests', 'isInitialized'),
      queryInterface.removeColumn('CourierWithdrawRequests', 'initializedAt'),
    ]);
  }
};
