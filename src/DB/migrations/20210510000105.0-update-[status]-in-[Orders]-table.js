'use strict';

const { DataTypes } = require('sequelize');

const ORDER_STATUSES = require('../dicts/ORDER_STATUSES');

module.exports = {
  up: (queryInterface, Sequelize) => {
    return Promise.all([
      queryInterface.changeColumn('Orders', 'status', {
        type: Sequelize.ENUM, required: true, values: ORDER_STATUSES,
        defaultValue: ORDER_STATUSES[ 0 ],
      }),
    ]);
  },
  down: (queryInterface, Sequelize) => {
    return Promise.all([]);
  }
};
