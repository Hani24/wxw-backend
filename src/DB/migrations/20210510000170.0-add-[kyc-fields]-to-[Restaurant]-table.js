'use strict';

const { DataTypes } = require('sequelize');

module.exports = {
  up: (queryInterface, Sequelize) => {
    return Promise.all([
      // [inner][stripe]
      queryInterface.addColumn('Restaurants', 'personId', {
        type: DataTypes.STRING, allowNull: true, defaultValue: null
      }),
      queryInterface.addColumn('Restaurants', 'accountId', {
        type: DataTypes.STRING, allowNull: true, defaultValue: null
      }),
      queryInterface.addColumn('Restaurants', 'isKycCompleted', {
        type: DataTypes.BOOLEAN, allowNull: true, defaultValue: false
      }),
      queryInterface.addColumn('Restaurants', 'kycCompletedAt', {
        type: DataTypes.DATE, allowNull: true, defaultValue: null
      }),
    ]);
  },
  down: (queryInterface, Sequelize) => {
    return Promise.all([
      queryInterface.removeColumn('Restaurants', 'personId'),
      queryInterface.removeColumn('Restaurants', 'accountId'),
      queryInterface.removeColumn('Restaurants', 'isKycCompleted'),
      queryInterface.removeColumn('Restaurants', 'kycCompletedAt'),
    ]);
  }
};
