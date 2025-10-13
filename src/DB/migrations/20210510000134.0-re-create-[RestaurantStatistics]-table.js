'use strict';

const { DataTypes } = require('sequelize');

module.exports = {
  up: async(queryInterface, Sequelize) => {

    await queryInterface.dropTable('RestaurantStatistics');

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
      totalOrders:{
        type: DataTypes.INTEGER(4).UNSIGNED, allowNull: false, defaultValue: 0,
      },
      totalAcceptedOrders:{
        type: DataTypes.INTEGER(4).UNSIGNED, allowNull: false, defaultValue: 0,
      },
      totalCanceledOrders:{
        type: DataTypes.INTEGER(4).UNSIGNED, allowNull: false, defaultValue: 0,
      },
      totalIncomeInCent:{
        type: DataTypes.INTEGER(4).UNSIGNED, allowNull: false, defaultValue: 0,
      },
      totalPreparationTimeInSeconds:{
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
