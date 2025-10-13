'use strict';

const { DataTypes } = require('sequelize');

const NOTIFICATION_TYPES = require('../dicts/NOTIFICATION_TYPES_RESTAURANT');
const RESTAURANT_EVENTS = require('../dicts/RESTAURANT_EVENTS');

module.exports = {
  up: (queryInterface, Sequelize) => {
    return Promise.all([
      queryInterface.changeColumn('RestaurantNotifications', 'type', {
        type: Sequelize.ENUM, required: true, values: NOTIFICATION_TYPES,
        defaultValue: NOTIFICATION_TYPES[ 0 ],
      }),
      queryInterface.changeColumn('RestaurantNotifications', 'event', {
        type: Sequelize.ENUM, required: true, values: RESTAURANT_EVENTS,
        defaultValue: RESTAURANT_EVENTS[ 0 ],
      }),
    ]);
  },
  down: (queryInterface, Sequelize) => {
    return Promise.all([]);
  }
};
