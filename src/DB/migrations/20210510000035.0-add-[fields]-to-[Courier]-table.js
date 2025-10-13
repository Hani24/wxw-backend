'use strict';

const { DataTypes } = require('sequelize');

module.exports = {
  up: (queryInterface, Sequelize) => {
    return Promise.all([
      queryInterface.addColumn('Couriers', 'isRequestSent', {
        type: DataTypes.BOOLEAN, allowNull: true, defaultValue: false,
      }),
      queryInterface.addColumn('Couriers', 'requestSentAt', {
        type: DataTypes.DATE, allowNull: true, defaultValue: null
      }),
    ]);
  },
  down: (queryInterface, Sequelize) => {
    return Promise.all([
      queryInterface.removeColumn('Couriers', 'isRequestSent'),
      queryInterface.removeColumn('Couriers', 'requestSentAt'),
    ]);
  }
};
