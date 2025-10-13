'use strict';

const { DataTypes } = require('sequelize');

const DELIVERY_DAYS = require('../dicts/DELIVERY_DAYS');
const DELIVERY_HOURS = require('../dicts/DELIVERY_HOURS');
const TIME_TYPES = require('../dicts/TIME_TYPES');

module.exports = {
  up: (queryInterface, Sequelize) => {

    return queryInterface.createTable('OrderDeliveryTimes', {
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
      deliveryDay: {
        type: DataTypes.ENUM, required: true, values: DELIVERY_DAYS,
        defaultValue: DELIVERY_DAYS[ 0 ],
      },
      deliveryHour: {
        type: DataTypes.ENUM, required: true, values: DELIVERY_HOURS,
        defaultValue: DELIVERY_HOURS[ 0 ],
      },
      deliveryTimeValue: {
        type: DataTypes.INTEGER(2).UNSIGNED, required: false, defaultValue: 0,
      },
      deliveryTimeType: {
        type: DataTypes.ENUM, required: false, values: TIME_TYPES,
        defaultValue: TIME_TYPES[ 0 ],
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
    return queryInterface.dropTable('OrderDeliveryTimes');
  }
};
