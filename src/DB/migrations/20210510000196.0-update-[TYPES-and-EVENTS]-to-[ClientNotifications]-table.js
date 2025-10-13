'use strict';

const { DataTypes } = require('sequelize');

const NOTIFICATION_TYPES = require('../dicts/NOTIFICATION_TYPES_CLIENT');

module.exports = {
  up: (queryInterface, Sequelize) => {
    return Promise.all([
      queryInterface.changeColumn('ClientNotifications', 'type', {
        type: Sequelize.ENUM, required: true, values: NOTIFICATION_TYPES,
        defaultValue: NOTIFICATION_TYPES[ 0 ],
      }),
    ]);
  },
  down: (queryInterface, Sequelize) => {
    return Promise.all([]);
  }
};
