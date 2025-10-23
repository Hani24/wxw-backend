'use strict';

const { DataTypes } = require('sequelize');
const ORDER_TYPES = require('../dicts/ORDER_TYPES');
const RESTAURANT_PRICING_MODELS = require('../dicts/RESTAURANT_PRICING_MODELS');

module.exports = {
  up: (queryInterface, Sequelize) => {

    return queryInterface.createTable('RestaurantOrderTypeSettings', {
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

      orderType: {
        type: DataTypes.ENUM,
        required: true,
        values: ORDER_TYPES,
        allowNull: false,
      },

      isEnabled: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },

      pricingModel: {
        type: DataTypes.ENUM,
        values: RESTAURANT_PRICING_MODELS,
        allowNull: true,
        defaultValue: null,
      },

      basePrice: {
        type: DataTypes.DECIMAL(8, 2),
        allowNull: true,
        defaultValue: null,
      },

      pricePerPerson: {
        type: DataTypes.DECIMAL(8, 2),
        allowNull: true,
        defaultValue: null,
      },

      pricePerHour: {
        type: DataTypes.DECIMAL(8, 2),
        allowNull: true,
        defaultValue: null,
      },

      minPeople: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: true,
        defaultValue: null,
      },

      maxPeople: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: true,
        defaultValue: null,
      },

      minHours: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: true,
        defaultValue: null,
      },

      maxHours: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: true,
        defaultValue: null,
      },

      serviceFeePercentage: {
        type: DataTypes.DECIMAL(4, 2),
        allowNull: false,
        defaultValue: 15.00,
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
      // Add unique constraint on restaurantId + orderType
      return queryInterface.addIndex('RestaurantOrderTypeSettings', {
        fields: ['restaurantId', 'orderType'],
        unique: true,
        name: 'unique_restaurant_order_type'
      });
    });

  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.dropTable('RestaurantOrderTypeSettings');
  }
};
