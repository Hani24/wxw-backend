'use strict';

const NOTIFICATION_TYPES_CLIENT = require('../dicts/NOTIFICATION_TYPES_CLIENT');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.changeColumn('ClientNotifications', 'type', {
      type: Sequelize.ENUM,
      values: NOTIFICATION_TYPES_CLIENT,
      defaultValue: NOTIFICATION_TYPES_CLIENT[0],
    });
  },
  down: async (queryInterface, Sequelize) => {
    // Reverting would require specifying the old enum values
    // This is intentionally left as a no-op
  }
};
