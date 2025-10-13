'use strict';

const { DataTypes } = require('sequelize');

module.exports = {
  up: (queryInterface, Sequelize) => {

    return queryInterface.createTable('GlobalSummaryStatistics', {
      id: {
        type: DataTypes.BIGINT(8).UNSIGNED,
        allowNull: false, autoIncrement: true, primaryKey: true,
      },

      totalClients:{
        type: DataTypes.INTEGER(4).UNSIGNED, allowNull: false, defaultValue: 0,
      },
      totalCouriers:{
        type: DataTypes.INTEGER(4).UNSIGNED, allowNull: false, defaultValue: 0,
      },
      totalEmployees:{
        type: DataTypes.INTEGER(4).UNSIGNED, allowNull: false, defaultValue: 0,
      },
      totalManagers:{
        type: DataTypes.INTEGER(4).UNSIGNED, allowNull: false, defaultValue: 0,
      },
      totalRestaurants:{
        type: DataTypes.INTEGER(4).UNSIGNED, allowNull: false, defaultValue: 0,
      },
      totalIncomeInCent:{
        type: DataTypes.BIGINT(8).UNSIGNED, allowNull: false, defaultValue: 0,
      },
      totalOrders:{
        type: DataTypes.BIGINT(8).UNSIGNED, allowNull: false, defaultValue: 0,
      },
      totalAcceptedOrders:{
        type: DataTypes.BIGINT(8).UNSIGNED, allowNull: false, defaultValue: 0,
      },
      totalCanceledOrders:{
        type: DataTypes.BIGINT(8).UNSIGNED, allowNull: false, defaultValue: 0,
      },
      totalPreparationTimeInSeconds:{
        type: DataTypes.BIGINT(8).UNSIGNED, allowNull: false, defaultValue: 0,
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
    return queryInterface.dropTable('GlobalSummaryStatistics');
  }
};
