'use strict';

const { DataTypes } = require('sequelize');

// https://ams-llc.atlassian.net/wiki/spaces/MAI/pages/169968150/R05.01+view+and+edit+the+restaurant+information
// The standard working time for each day of week is 9:00 - 22:00

module.exports = {
  up: (queryInterface, Sequelize) => {

    return queryInterface.createTable('RestaurantWorkingTimes', {
      id: {
        type: DataTypes.BIGINT(8).UNSIGNED,
        allowNull: false, autoIncrement: true, primaryKey: true,
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
      mondayOpenAt: {
        type: DataTypes.INTEGER(1).UNSIGNED, allowNull: false, defaultValue: 9, // AM == 09:00
      },
      mondayCloseAt: {
        type: DataTypes.INTEGER(1).UNSIGNED, allowNull: false, defaultValue: 10, // PM == 22:00
      },
      tuesdayOpenAt: {
        type: DataTypes.INTEGER(1).UNSIGNED, allowNull: false, defaultValue: 9, // AM == 09:00
      },
      tuesdayCloseAt: {
        type: DataTypes.INTEGER(1).UNSIGNED, allowNull: false, defaultValue: 10, // PM == 22:00
      },
      wednesdayOpenAt: {
        type: DataTypes.INTEGER(1).UNSIGNED, allowNull: false, defaultValue: 9, // AM == 09:00
      },
      wednesdayCloseAt: {
        type: DataTypes.INTEGER(1).UNSIGNED, allowNull: false, defaultValue: 10, // PM == 22:00
      },
      thursdayOpenAt: {
        type: DataTypes.INTEGER(1).UNSIGNED, allowNull: false, defaultValue: 9, // AM == 09:00
      },
      thursdayCloseAt: {
        type: DataTypes.INTEGER(1).UNSIGNED, allowNull: false, defaultValue: 10, // PM == 22:00
      },
      fridayOpenAt: {
        type: DataTypes.INTEGER(1).UNSIGNED, allowNull: false, defaultValue: 9, // AM == 09:00
      },
      fridayCloseAt: {
        type: DataTypes.INTEGER(1).UNSIGNED, allowNull: false, defaultValue: 10, // PM == 22:00
      },
      saturdayOpenAt: {
        type: DataTypes.INTEGER(1).UNSIGNED, allowNull: false, defaultValue: 9, // AM == 09:00
      },
      saturdayCloseAt: {
        type: DataTypes.INTEGER(1).UNSIGNED, allowNull: false, defaultValue: 10, // PM == 22:00
      },
      sundayOpenAt: {
        type: DataTypes.INTEGER(1).UNSIGNED, allowNull: false, defaultValue: 9, // AM == 09:00
      },
      sundayCloseAt: {
        type: DataTypes.INTEGER(1).UNSIGNED, allowNull: false, defaultValue: 10, // PM == 22:00
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
    return queryInterface.dropTable('RestaurantWorkingTimes');
  }
};
