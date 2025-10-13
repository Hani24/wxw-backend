'use strict';

const { DataTypes } = require('sequelize');

module.exports = {
  up: (queryInterface, Sequelize) => {
    return Promise.all([
      queryInterface.addColumn('Restaurants', 'website', {
        type: DataTypes.STRING, allowNull: true, defaultValue: 'n/a',
      }),
      queryInterface.addColumn('Restaurants', 'orderPrepTime', {
        type: DataTypes.INTEGER(4).UNSIGNED, allowNull: true, defaultValue: 30,
      }),
    ]);
  },
  down: (queryInterface, Sequelize) => {
    return Promise.all([
      queryInterface.removeColumn('Restaurants', 'website'),
      queryInterface.removeColumn('Restaurants', 'orderPrepTime'),
    ]);
  }
};
