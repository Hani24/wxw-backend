'use strict';

const { DataTypes } = require('sequelize');

module.exports = {
  up: (queryInterface, Sequelize) => {
    return Promise.all([
      queryInterface.addColumn('Restaurants', 'checksum', {
        type: DataTypes.STRING, allowNull: true, defaultValue: ''      
      }),
    ]);
  },
  down: (queryInterface, Sequelize) => {
    return Promise.all([
      queryInterface.removeColumn('Restaurants', 'checksum'),
    ]);
  }
};
