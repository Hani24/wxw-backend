'use strict';

const { DataTypes } = require('sequelize');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Add daysRequiredToPrepareOnSitePresence field
    await queryInterface.addColumn('RestaurantOrderTypeSettings', 'daysRequiredToPrepareOnSitePresence', {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
      defaultValue: 0,
      comment: 'Number of days required to prepare on-site-presence orders'
    });

    // Add daysRequiredToPrepareCatering field
    await queryInterface.addColumn('RestaurantOrderTypeSettings', 'daysRequiredToPrepareCatering', {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
      defaultValue: 0,
      comment: 'Number of days required to prepare catering orders'
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('RestaurantOrderTypeSettings', 'daysRequiredToPrepareOnSitePresence');
    await queryInterface.removeColumn('RestaurantOrderTypeSettings', 'daysRequiredToPrepareCatering');
  }
};
