'use strict';

const { DataTypes } = require('sequelize');

module.exports = {
  up: (queryInterface, Sequelize) => {

    return queryInterface.createTable('RestaurantStatistics', {
      id: {
        type: DataTypes.BIGINT(8).UNSIGNED,
        allowNull: false, autoIncrement: true, primaryKey: true,
      },

      restaurantId: {
        type: DataTypes.BIGINT(8).UNSIGNED,
        allowNull: false,
        required: true,
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
        references: {
          model: 'Restaurants',
          key: 'id'
        },
      },
      incomeInCent:{
        type: DataTypes.INTEGER(4).UNSIGNED, allowNull: false, defaultValue: 0,
      },
      ordersTotal:{
        type: DataTypes.INTEGER(4).UNSIGNED, allowNull: false, defaultValue: 0,
      },
      ordersAccepted:{
        type: DataTypes.INTEGER(4).UNSIGNED, allowNull: false, defaultValue: 0,
      },
      ordersCanceled:{
        type: DataTypes.INTEGER(4).UNSIGNED, allowNull: false, defaultValue: 0,
      },
      preparationTimeInSeconds:{
        type: DataTypes.INTEGER(4).UNSIGNED, allowNull: false, defaultValue: 0,
      },

      createdAt: {
        type: DataTypes.DATE, 
        allowNull: false, defaultValue: DataTypes.NOW
      },
      updatedAt: {
        type: DataTypes.DATE, 
        allowNull: false, defaultValue: DataTypes.NOW
      },
    });

  },
  down: (queryInterface, Sequelize) => {
    return queryInterface.dropTable('RestaurantStatistics');
  }
};
