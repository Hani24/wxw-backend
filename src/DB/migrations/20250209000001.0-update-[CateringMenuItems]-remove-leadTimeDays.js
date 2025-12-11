'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Remove leadTimeDays column from CateringMenuItems table
    // This field is redundant with daysRequiredToPrepareCatering in RestaurantOrderTypeSettings
    await queryInterface.removeColumn('CateringMenuItems', 'leadTimeDays');
  },

  down: async (queryInterface, Sequelize) => {
    // Restore leadTimeDays column if migration needs to be rolled back
    await queryInterface.addColumn('CateringMenuItems', 'leadTimeDays', {
      type: Sequelize.INTEGER.UNSIGNED,
      allowNull: false,
      defaultValue: 0,
      comment: 'Days of advance notice required for this item (DEPRECATED - use RestaurantOrderTypeSettings.daysRequiredToPrepareCatering instead)'
    });
  }
};
