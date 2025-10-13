'use strict';

const { DataTypes } = require('sequelize');

module.exports = {
  up: (queryInterface, Sequelize) => {
    return Promise.all([
      queryInterface.changeColumn('CourierWithdrawRequests', 'cardHolderName', {
        type: DataTypes.STRING, allowNull: true, defaultValue: '',
      }),
      queryInterface.changeColumn('CourierWithdrawRequests', 'cardNumber', {
        type: DataTypes.STRING, allowNull: true, defaultValue: '',
      }),
    ]);
  },
  down: (queryInterface, Sequelize) => {
    // old with custom bank-card
    return Promise.all([
      queryInterface.changeColumn('CourierWithdrawRequests', 'cardHolderName', {
        type: DataTypes.TEXT, allowNull: false, required: true
      }),
      queryInterface.changeColumn('CourierWithdrawRequests', 'cardNumber', {
        type: DataTypes.TEXT, allowNull: false, required: true
      }),
    ]);
  }
};
