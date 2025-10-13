'use strict';

const { DataTypes } = require('sequelize');

module.exports = {
  up: (queryInterface, Sequelize) => {
    return Promise.all([
      queryInterface.addColumn('Clients', 'lat', {
        type: DataTypes.STRING, allowNull: true, defaultValue: '',
      }),
      queryInterface.addColumn('Clients', 'lon', {
        type: DataTypes.STRING, allowNull: true, defaultValue: '',
      }),
    ]);
  },
  down: (queryInterface, Sequelize) => {
    return Promise.all([
      queryInterface.removeColumn('Clients','lat'),
      queryInterface.removeColumn('Clients','lon'),
    ]);
  }
};
