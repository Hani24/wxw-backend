'use strict';

const { DataTypes } = require('sequelize');

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.dropTable('RestaurantWorkingTime');
  },
  down: (queryInterface, Sequelize) => {
    // 
  }
};
