'use strict';

const { DataTypes } = require('sequelize');

module.exports = {
  up: (queryInterface, Sequelize) => {
    return Promise.all([
      // [inner]:[flags]:[payments]
      queryInterface.addColumn('Restaurants', 'balance', {
        type: DataTypes.DECIMAL(8,2).UNSIGNED, allowNull: false, defaultValue: 0
      }),
    ]);
  },
  down: (queryInterface, Sequelize) => {
    return Promise.all([
      queryInterface.removeColumn('Restaurants', 'balance'),
    ]);
  }
};

