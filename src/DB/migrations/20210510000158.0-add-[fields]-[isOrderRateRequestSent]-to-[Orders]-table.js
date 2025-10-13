'use strict';

const { DataTypes } = require('sequelize');
// const ORDER_STATUSES = require('../dicts/ORDER_STATUSES');

module.exports = {
  up: (queryInterface, Sequelize) => {

    return Promise.all([
      queryInterface.addColumn('Orders', 'isOrderRateRequestSent', {
        type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false
      }),
      queryInterface.addColumn('Orders', 'orderRateRequestSentAt', {
        type: DataTypes.DATE, allowNull: true, defaultValue: null
      }),
    ]);
  },
  down: (queryInterface, Sequelize) => {
    return Promise.all([
      queryInterface.removeColumn('Orders', 'isOrderRateRequestSent'),
      queryInterface.removeColumn('Orders', 'orderRateRequestSentAt'),
    ]);
  }
};
