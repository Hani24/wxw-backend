'use strict';

const { DataTypes } = require('sequelize');

module.exports = {
  up: (queryInterface, Sequelize) => {
    return Promise.all([
      queryInterface.addColumn('CourierWithdrawRequests', 'isPartialyApproved', {
        type: DataTypes.BOOLEAN, allowNull: true, defaultValue: false
      }),
      queryInterface.addColumn('CourierWithdrawRequests', 'approvedAmount', {
        type: DataTypes.DECIMAL(8,2).UNSIGNED, allowNull: false, defaultValue: 0
      }),
      queryInterface.addColumn('CourierWithdrawRequests', 'partialyApprovedReason', {
        type: DataTypes.STRING, allowNull: true, defaultValue: null,
      }),
    ]);
  },
  down: (queryInterface, Sequelize) => {
    return Promise.all([
      queryInterface.removeColumn('CourierWithdrawRequests', 'isPartialyApproved'),
      queryInterface.removeColumn('CourierWithdrawRequests', 'approvedAmount'),
      queryInterface.removeColumn('CourierWithdrawRequests', 'partialyApprovedReason'),
    ]);
  }
};
