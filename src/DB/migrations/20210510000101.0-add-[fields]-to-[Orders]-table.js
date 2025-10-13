'use strict';

const { DataTypes } = require('sequelize');

module.exports = {
  up: (queryInterface, Sequelize) => {
    return Promise.all([
      // [inner][stripe] allow server to process [auto] payment
      queryInterface.addColumn('Orders', 'isPaymentRequestAllowed', {
        type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false
      }),
      queryInterface.addColumn('Orders', 'paymentRequestAllowedAt', {
        type: DataTypes.DATE, allowNull: true, defaultValue: null
      }),
      // [inner][stripe] server has requested [auto] payment ?
      queryInterface.addColumn('Orders', 'isPaymentRequested', {
        type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false
      }),
      queryInterface.addColumn('Orders', 'paymentRequestedAt', {
        type: DataTypes.DATE, allowNull: true, defaultValue: null
      }),
    ]);
  },
  down: (queryInterface, Sequelize) => {
    return Promise.all([
      queryInterface.removeColumn('Orders', 'isPaymentRequestAllowed'),
      queryInterface.removeColumn('Orders', 'paymentRequestAllowedAt'),
      queryInterface.removeColumn('Orders', 'isPaymentRequested'),
      queryInterface.removeColumn('Orders', 'paymentRequestedAt'),
    ]);
  }
};
