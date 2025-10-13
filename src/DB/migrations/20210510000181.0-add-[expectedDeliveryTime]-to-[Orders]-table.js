'use strict';

const { DataTypes } = require('sequelize');

module.exports = {
  up: (queryInterface, Sequelize) => {
    return Promise.all([
      queryInterface.addColumn('Orders', 'expectedDeliveryTime', {
        // type: DataTypes.INTEGER(4).UNSIGNED, allowNull: false, defaultValue: 0,
        type: DataTypes.DATE, allowNull: true, defaultValue: null,
      }),
    ]);
  },
  down: (queryInterface, Sequelize) => {
    return Promise.all([
      queryInterface.removeColumn('Orders', 'expectedDeliveryTime'),
    ]);
  }
};
