'use strict';

const { DataTypes } = require('sequelize');

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.addColumn('Orders', 'finalPrice', {
      // all restos + all discounts
      type: DataTypes.DECIMAL(8,2), allowNull: false, defaultValue: 0
    });
  },
  down: (queryInterface, Sequelize) => {
    return queryInterface.removeColumn('Orders', 'finalPrice');
  }
};
