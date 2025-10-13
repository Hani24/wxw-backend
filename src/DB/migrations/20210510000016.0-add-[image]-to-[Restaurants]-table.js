'use strict';

const { DataTypes } = require('sequelize');

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.addColumn('Restaurants', 'image', {
      type: DataTypes.STRING, allowNull: true, defaultValue: '',
    });
  },
  down: (queryInterface, Sequelize) => {
    return queryInterface.removeColumn('Restaurants','image');
  }
};
