'use strict';

const { DataTypes } = require('sequelize');

module.exports = {
  up: (queryInterface, Sequelize) => {
    return Promise.all([


      queryInterface.changeColumn('Clients', 'lat', {
        type: DataTypes.FLOAT, allowNull: true, defaultValue: 0,
      }),
      queryInterface.changeColumn('Clients', 'lon', {
        type: DataTypes.FLOAT, allowNull: true, defaultValue: 0,
      }),

      queryInterface.changeColumn('Courier', 'lat', {
        type: DataTypes.FLOAT, allowNull: true, defaultValue: 0,
      }),
      queryInterface.changeColumn('Courier', 'lon', {
        type: DataTypes.FLOAT, allowNull: true, defaultValue: 0,
      }),

      queryInterface.changeColumn('Restaurant', 'lat', {
        type: DataTypes.FLOAT, allowNull: true, defaultValue: 0,
      }),
      queryInterface.changeColumn('Restaurant', 'lon', {
        type: DataTypes.FLOAT, allowNull: true, defaultValue: 0,
      }),




    ]);
  },
  down: (queryInterface, Sequelize) => {
    return Promise.all([]);
  }
};
