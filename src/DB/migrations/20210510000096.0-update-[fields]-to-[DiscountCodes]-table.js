'use strict';

const { DataTypes } = require('sequelize');

module.exports = {
  up: (queryInterface, Sequelize) => {
    return Promise.all([
      queryInterface.addColumn('DiscountCodes', 'totalDiscount', {
        type: DataTypes.DECIMAL(8,2), allowNull: true, defaultValue: 0
      }),
    ]);
  },
  down: (queryInterface, Sequelize) => {
    return Promise.all([
      queryInterface.removeColumn('DiscountCodes', 'totalDiscount'),
    ]);
  }
};
