'use strict';

const { DataTypes } = require('sequelize');

module.exports = {
  up: (queryInterface, Sequelize) => {

    return Promise.all([
      queryInterface.addColumn('RestaurantWorkingTimes', 'isMondayOpen',{
        type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false,
      }),
      queryInterface.addColumn('RestaurantWorkingTimes', 'isTuesdayOpen',{
        type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false,
      }),
      queryInterface.addColumn('RestaurantWorkingTimes', 'isWednesdayOpen',{
        type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false,
      }),
      queryInterface.addColumn('RestaurantWorkingTimes', 'isThursdayOpen',{
        type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false,
      }),
      queryInterface.addColumn('RestaurantWorkingTimes', 'isFridayOpen',{
        type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false,
      }),
      queryInterface.addColumn('RestaurantWorkingTimes', 'isSaturdayOpen',{
        type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false,
      }),
      queryInterface.addColumn('RestaurantWorkingTimes', 'isSundayOpen',{
        type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false,
      }),
    ]);

  },
  down: (queryInterface, Sequelize) => {
    return Promise.all([
      queryInterface.removeColumn('RestaurantWorkingTimes', 'isMondayOpen'),
      queryInterface.removeColumn('RestaurantWorkingTimes', 'isTuesdayOpen'),
      queryInterface.removeColumn('RestaurantWorkingTimes', 'isWednesdayOpen'),
      queryInterface.removeColumn('RestaurantWorkingTimes', 'isThursdayOpen'),
      queryInterface.removeColumn('RestaurantWorkingTimes', 'isFridayOpen'),
      queryInterface.removeColumn('RestaurantWorkingTimes', 'isSaturdayOpen'),
      queryInterface.removeColumn('RestaurantWorkingTimes', 'isSundayOpen'),
    ]);
  }
};
