'use strict';

const { DataTypes } = require('sequelize');

module.exports = {
  up: (queryInterface, Sequelize) => {
    return Promise.all([
      queryInterface.addColumn('CourierWithdrawRequests', 'refundedAmount', {
        type: DataTypes.DECIMAL(8,2).UNSIGNED, allowNull: true, defaultValue: 0
      }),
    ]);
  },
  down: (queryInterface, Sequelize) => {
    return Promise.all([
      queryInterface.removeColumn('CourierWithdrawRequests', 'refundedAmount'),
    ]);
  }
};
