'use strict';

const NOTIFICATION_TYPES_RESTAURANT = require('../dicts/NOTIFICATION_TYPES_RESTAURANT');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.changeColumn('RestaurantNotifications', 'type', {
      type: Sequelize.ENUM,
      values: NOTIFICATION_TYPES_RESTAURANT,
      defaultValue: NOTIFICATION_TYPES_RESTAURANT[0],
    });
  },
  down: async (queryInterface, Sequelize) => {
    // Reverting would require specifying the old enum values
    // This is intentionally left as a no-op
  }
};
