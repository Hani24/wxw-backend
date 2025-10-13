'use strict';

const { DataTypes } = require('sequelize');

module.exports = {
  up: (queryInterface, Sequelize) => {
    return Promise.all([
      queryInterface.addColumn('MenuCategories', 'isDeleted', {
        type: DataTypes.BOOLEAN, allowNull: true, defaultValue: false,
      }),
      queryInterface.addColumn('MenuCategories', 'deletedAt', {
        type: DataTypes.DATE, allowNull: true, defaultValue: null
      }),
    ]);
  },
  down: (queryInterface, Sequelize) => {
    return Promise.all([
      queryInterface.removeColumn('MenuCategories', 'isDeleted'),
      queryInterface.removeColumn('MenuCategories', 'deletedAt'),
    ]);
  }
};
