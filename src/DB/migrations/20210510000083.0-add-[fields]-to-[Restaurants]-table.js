'use strict';

const { DataTypes } = require('sequelize');

module.exports = {
  up: (queryInterface, Sequelize) => {
    return Promise.all([
      queryInterface.addColumn('Restaurants', 'email', {
        type: DataTypes.STRING, allowNull: true, defaultValue: 'n/a',
      }),
      queryInterface.addColumn('Restaurants', 'phone', {
        type: DataTypes.STRING, allowNull: true, defaultValue: 'n/a',
      }),
    ]);
  },
  down: (queryInterface, Sequelize) => {
    return Promise.all([
      queryInterface.removeColumn('Restaurants', 'email'),
      queryInterface.removeColumn('Restaurants', 'phone'),
    ]);
  }
};
