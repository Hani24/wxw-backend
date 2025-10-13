'use strict';

const { DataTypes } = require('sequelize');
const ORDER_STATUSES = require('../dicts/ORDER_STATUSES');

module.exports = {
  up: (queryInterface, Sequelize) => {

    return queryInterface.createTable('OrderSuppliers', {
      id: {
        type: DataTypes.BIGINT(8).UNSIGNED,
        allowNull: false, autoIncrement: true, primaryKey: true,
      },

      orderId: {
        type: DataTypes.BIGINT(8).UNSIGNED,
        allowNull: false,
        required: true,
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
        references: {
          model: 'Orders',
          key: 'id'
        },
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
      discountAmount: {
        type: DataTypes.DECIMAL(4,2), allowNull: false, defaultValue: 0
      },
      discountCode: {
        type: DataTypes.STRING, allowNull: false, defaultValue: ''
      },
      totalPrice: {
        type: DataTypes.DECIMAL(8,2), allowNull: false, defaultValue: 0
      },
      totalItems: {
        type: DataTypes.INTEGER, allowNull: false, defaultValue: 0
      },
      isTakenByCourier: {
        type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false
      },
      takenByCourierAt: {
        type: DataTypes.DATE, allowNull: true, defaultValue: null
      },
      isCanceledByRestaurant: {
        type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false
      },
      canceledByRestaurantAt: {
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
    return queryInterface.dropTable('OrderSuppliers');
  }
};
