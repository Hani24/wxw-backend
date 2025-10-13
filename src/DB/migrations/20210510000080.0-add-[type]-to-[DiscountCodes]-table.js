'use strict';

const { DataTypes } = require('sequelize');

const DISCOUNT_TYPES = require('../dicts/DISCOUNT_TYPES');

module.exports = {
  up: (queryInterface, Sequelize) => {
    return Promise.all([
      queryInterface.addColumn('DiscountCodes', 'type', {
        type: DataTypes.ENUM, required: true, values: DISCOUNT_TYPES,
        defaultValue: DISCOUNT_TYPES[ 0 ],
      }),
    ]);
  },
  down: (queryInterface, Sequelize) => {
    return Promise.all([
      queryInterface.removeColumn('DiscountCodes', 'type'),
    ]);
  }
};
