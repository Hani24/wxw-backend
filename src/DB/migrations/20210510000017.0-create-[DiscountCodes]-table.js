'use strict';

const { DataTypes } = require('sequelize');

module.exports = {
  up: (queryInterface, Sequelize) => {

    return queryInterface.createTable('DiscountCodes', {
      id: {
        type: DataTypes.BIGINT(8).UNSIGNED,
        allowNull: false, autoIncrement: true, primaryKey: true,
      },

      // restaurantId: {
      //   type: DataTypes.BIGINT(8).UNSIGNED,
      //   allowNull: false,
      //   required: true,
      //   onUpdate: 'CASCADE',
      //   onDelete: 'CASCADE',
      //   references: {
      //     model: 'Restaurants',
      //     key: 'id'
      //   },
      // },
      isActive: {
        type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true
      },
      code: {
        type: DataTypes.STRING, allowNull: false
      },
      discount: {
        type: DataTypes.DECIMAL(4,2), allowNull: false, defaultValue: 0
      },
      description: {
        type: DataTypes.TEXT, allowNull: false, defaultValue: ''
      },
      usedTimes: {
        type: DataTypes.INTEGER.UNSIGNED, allowNull: false, defaultValue: 0
      },
      expiresAt: {
        type: DataTypes.DATE, allowNull: true, defaultValue: null
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
    return queryInterface.dropTable('DiscountCodes');
  }
};
