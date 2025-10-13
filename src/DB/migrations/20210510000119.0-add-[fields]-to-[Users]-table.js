'use strict';

const { DataTypes } = require('sequelize');

module.exports = {
  up: (queryInterface, Sequelize) => {
    return Promise.all([
      queryInterface.addColumn('Users', 'restrictedAt', {
        type: DataTypes.DATE, allowNull: true, defaultValue: null
      }),
      queryInterface.addColumn('Users', 'isDeleted', {
        type: DataTypes.BOOLEAN, allowNull: true, defaultValue: false
      }),
      queryInterface.addColumn('Users', 'deletedAt', {
        type: DataTypes.DATE, allowNull: true, defaultValue: null
      }),
    ]);
  },
  down: (queryInterface, Sequelize) => {
    return Promise.all([
      queryInterface.removeColumn('Users', 'restrictedAt'),
      queryInterface.removeColumn('Users', 'isDeleted'),
      queryInterface.removeColumn('Users', 'deletedAt'),
    ]);
  }
};
