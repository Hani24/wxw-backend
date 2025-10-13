'use strict';

const { DataTypes } = require('sequelize');

module.exports = {
  up: (queryInterface, Sequelize) => {
    return Promise.all([
      queryInterface.addColumn('Clients', 'isDeleted', {
        type: DataTypes.BOOLEAN, allowNull: true, defaultValue: false,
      }),
      queryInterface.addColumn('Clients', 'deletedAt', {
        type: DataTypes.DATE, allowNull: true, defaultValue: null
      }),
    ]);
  },
  down: (queryInterface, Sequelize) => {
    return Promise.all([
      queryInterface.removeColumn('Clients', 'isDeleted'),
      queryInterface.removeColumn('Clients', 'deletedAt'),
    ]);
  }
};
