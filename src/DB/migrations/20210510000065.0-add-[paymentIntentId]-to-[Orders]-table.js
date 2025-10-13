'use strict';

const { DataTypes } = require('sequelize');

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.addColumn('Orders', 'paymentIntentId', {
      type: DataTypes.TEXT, allowNull: true, defaultValue: null
    });
  },
  down: (queryInterface, Sequelize) => {
    return queryInterface.removeColumn('Orders','paymentIntentId');
  }
};
