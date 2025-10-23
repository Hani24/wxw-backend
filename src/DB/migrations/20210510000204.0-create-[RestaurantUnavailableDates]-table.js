'use strict';

const { DataTypes } = require('sequelize');

module.exports = {
  up: (queryInterface, Sequelize) => {

    return queryInterface.createTable('RestaurantUnavailableDates', {
      id: {
        type: DataTypes.BIGINT(8).UNSIGNED,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
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

      unavailableDate: {
        type: DataTypes.DATEONLY,
        allowNull: false,
        required: true,
      },

      reason: {
        type: DataTypes.TEXT,
        allowNull: true,
        defaultValue: null,
      },

      isFullDayBlocked: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },

      blockedFromTime: {
        type: DataTypes.TIME,
        allowNull: true,
        defaultValue: null,
      },

      blockedToTime: {
        type: DataTypes.TIME,
        allowNull: true,
        defaultValue: null,
      },

      createdAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
      },

      updatedAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
      },
    }).then(() => {
      // Add index for faster date queries
      return queryInterface.addIndex('RestaurantUnavailableDates', {
        fields: ['restaurantId', 'unavailableDate'],
        name: 'idx_restaurant_unavailable_date'
      });
    });

  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.dropTable('RestaurantUnavailableDates');
  }
};
