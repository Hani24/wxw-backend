'use strict';

const { DataTypes } = require('sequelize');

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.renameColumn('DiscountSettings','areDiscountsEnabled','isEnabled');
  },
  down: (queryInterface, Sequelize) => {
    return queryInterface.renameColumn('DiscountSettings','isEnabled','areDiscountsEnabled');
  }
};
