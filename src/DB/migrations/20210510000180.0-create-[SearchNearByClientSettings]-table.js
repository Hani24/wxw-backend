'use strict';

const { DataTypes } = require('sequelize');

const DISTANCE_UNITS = require('../dicts/DISTANCE_UNITS');

module.exports = {
  up: (queryInterface, Sequelize) => {

    return queryInterface.createTable('SearchNearByClientSettings', {
      id: {
        type: DataTypes.BIGINT(8).UNSIGNED,
        allowNull: false, autoIncrement: true, primaryKey: true,
      },

      unitType: {
        type: DataTypes.ENUM, required: true, values: DISTANCE_UNITS,
        defaultValue: DISTANCE_UNITS[ 0 ],
      },
      maxSearchSquareInDegrees: {
        type: DataTypes.FLOAT.UNSIGNED, allowNull: true, defaultValue: 0.1,
      },
      maxSearchRadius: {
        type: DataTypes.FLOAT.UNSIGNED, allowNull: true, defaultValue: 15.0,
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
    return queryInterface.dropTable('SearchNearByClientSettings');
  }
};
