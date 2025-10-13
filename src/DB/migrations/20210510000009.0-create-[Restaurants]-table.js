'use strict';

const { DataTypes } = require('sequelize');

// https://ams-llc.atlassian.net/wiki/spaces/MAI/pages/169968150/R05.01+view+and+edit+the+restaurant+information
// The standard working time for each day of week is 9:00 - 22:00

const RESTAURANT_TYPES = require('../dicts/RESTAURANT_TYPES');

module.exports = {
  up: (queryInterface, Sequelize) => {

    return queryInterface.createTable('Restaurants', {
      id: {
        type: DataTypes.BIGINT(8).UNSIGNED,
        allowNull: false, autoIncrement: true, primaryKey: true,
      },

      userId: {
        type: DataTypes.BIGINT(8).UNSIGNED,
        allowNull: false,
        required: true,
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
        references: {
          model: 'Users',
          key: 'id'
        },
      },
      name: {
        type: DataTypes.STRING, allowNull: true, defaultValue: '',
      },
      description: {
        type: DataTypes.TEXT, allowNull: true, defaultValue: '',
      },
      country: {
        type: DataTypes.STRING, allowNull: true, defaultValue: '',
      },
      city: {
        type: DataTypes.STRING, allowNull: true, defaultValue: '',
      },
      zip: {
        type: DataTypes.STRING, allowNull: true, defaultValue: '',
      },
      street: {
        type: DataTypes.STRING, allowNull: true, defaultValue: '',
      },
      // NOTE: what data type should it be, and range ???
      rating: {
        type: Sequelize.REAL, allowNull: false, defaultValue: 0,
      },
      type: {
        type: Sequelize.ENUM, required: true, values: RESTAURANT_TYPES,
        defaultValue: RESTAURANT_TYPES[ 0 ],
      },
      lat: { // gps: [lat/lon] if type === mobile-van
        type: DataTypes.STRING, allowNull: true, defaultValue: '',
      },
      lon: {
        type: DataTypes.STRING, allowNull: true, defaultValue: '',
      },
      isOpen: {
        type: DataTypes.BOOLEAN, allowNull: true, defaultValue: false,
      },

      // openAt: {
      //   type: DataTypes.DATE, allowNull: true, defaultValue: null,
      // },
      // closedAt: {
      //   type: DataTypes.DATE, allowNull: true, defaultValue: null,
      // },

      isVerified: {
        type: DataTypes.BOOLEAN, allowNull: true, defaultValue: false,
      },
      isRestricted: {
        type: DataTypes.BOOLEAN, allowNull: true, defaultValue: false,
      },
      verifiedAt: {
        type: DataTypes.DATE, allowNull: true, defaultValue: null
      },
      restrictedAt: {
        type: DataTypes.DATE, allowNull: true, defaultValue: null
      },
      isDeleted: {
        type: DataTypes.BOOLEAN, allowNull: true, defaultValue: false,
      },
      deletedAt: {
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
    return queryInterface.dropTable('Restaurants');
  }
};
