'use strict';

const { DataTypes } = require('sequelize');

module.exports = {
  up: (queryInterface, Sequelize) => {

    return queryInterface.createTable('DiscountSettings', {
      id: {
        type: DataTypes.BIGINT(8).UNSIGNED,
        allowNull: false, autoIncrement: true, primaryKey: true,
      },

      areDiscountsEnabled: {
        type: DataTypes.BOOLEAN, allowNull: true, defaultValue: true,
      },
      maxDiscountPercent: {
        type: DataTypes.INTEGER(1).UNSIGNED, allowNull: true, defaultValue: 20,
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
    return queryInterface.dropTable('DiscountSettings');
  }
};
