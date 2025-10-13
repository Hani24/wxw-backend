'use strict';

const { DataTypes } = require('sequelize');

module.exports = {
  up: (queryInterface, Sequelize) => {
    return Promise.all([
      queryInterface.addColumn('Users', 'lat', {
        type: DataTypes.STRING, allowNull: true, defaultValue: null,
      }),
      queryInterface.addColumn('Users', 'lon', {
        type: DataTypes.STRING, allowNull: true, defaultValue: null,
      }),
    ]);
  },
  down: (queryInterface, Sequelize) => {
    return Promise.all([
      queryInterface.removeColumn('Users','lat'),
      queryInterface.removeColumn('Users','lon'),
    ]);
  }
};
