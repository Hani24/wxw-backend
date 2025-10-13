'use strict';

const { DataTypes } = require('sequelize');

const DISTANCE_UNITS = require('../dicts/DISTANCE_UNITS');

module.exports = {
  up: (queryInterface, Sequelize) => {

    return queryInterface.createTable('DeliveryPriceSettings', {
      id: {
        type: DataTypes.BIGINT(8).UNSIGNED,
        allowNull: false, autoIncrement: true, primaryKey: true,
      },

      unitPrice: {
        type: DataTypes.DECIMAL(8,2).UNSIGNED, allowNull: false, required: true
      },
      unitType: {
        type: DataTypes.ENUM, required: true, values: DISTANCE_UNITS,
        defaultValue: DISTANCE_UNITS[ 0 ],
      },
      isDeleted: {
        type: DataTypes.BOOLEAN, allowNull: true, defaultValue: false,      
      },
      deletedAt: {
        type: DataTypes.DATE, allowNull: true, defaultValue: null,      
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
    return queryInterface.dropTable('DeliveryPriceSettings');
  }
};
