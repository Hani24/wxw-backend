'use strict';

const { DataTypes } = require('sequelize');

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.addColumn('MenuItems', 'order', {
      type: DataTypes.INTEGER.UNSIGNED, allowNull: false, defaultValue: 0
    });
  },
  down: (queryInterface, Sequelize) => {
    return queryInterface.removeColumn('MenuItems','order');
  }
};
