'use strict';

const { DataTypes } = require('sequelize');

const RESTAURANT_EVENTS = require('../dicts/RESTAURANT_EVENTS');

module.exports = {
  up: (queryInterface, Sequelize) => {
    return Promise.all([
      queryInterface.addColumn('RestaurantNotifications', 'event', {
        type: Sequelize.ENUM, required: true, values: RESTAURANT_EVENTS,
        defaultValue: RESTAURANT_EVENTS[ 0 ],
      }),
    ]);
  },
  down: (queryInterface, Sequelize) => {
    return Promise.all([
      queryInterface.removeColumn('RestaurantNotifications', 'event'),
    ]);
  }
};
