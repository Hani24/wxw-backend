'use strict';

const { DataTypes } = require('sequelize');

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.addColumn('PaymentCards', 'paymentMethodId', {
      type: DataTypes.STRING, allowNull: true, defaultValue: null
    });
  },
  down: (queryInterface, Sequelize) => {
    return queryInterface.removeColumn('PaymentCards','paymentMethodId');
  }
};
