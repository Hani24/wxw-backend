'use strict';

const { DataTypes } = require('sequelize');

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.addColumn('RestaurantPosts', 'totalRSVPs', {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      defaultValue: 0,
      after: 'totalComments'
    });
  },
  down: (queryInterface, Sequelize) => {
    return queryInterface.removeColumn('RestaurantPosts', 'totalRSVPs');
  }
};
