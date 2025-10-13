'use strict';

const { DataTypes } = require('sequelize');

module.exports = {
  up: (queryInterface, Sequelize) => {
    return Promise.all([
      queryInterface.addColumn('MenuItems', 'isDeleted', {
        type: DataTypes.BOOLEAN, allowNull: true, defaultValue: false,
      }),
      queryInterface.addColumn('MenuItems', 'deletedAt', {
        type: DataTypes.DATE, allowNull: true, defaultValue: null
      }),
    ]);
  },
  down: (queryInterface, Sequelize) => {
    return Promise.all([
      queryInterface.removeColumn('MenuItems', 'isDeleted'),
      queryInterface.removeColumn('MenuItems', 'deletedAt'),
    ]);
  }
};
