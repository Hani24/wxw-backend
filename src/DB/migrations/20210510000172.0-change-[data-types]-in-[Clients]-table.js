'use strict';

const { DataTypes } = require('sequelize');

// <float> => (DECIMAL(11,8)) 49.8478, 24.0258
module.exports = {
  up: async(queryInterface, Sequelize) => {

    await Promise.all([
      queryInterface.removeColumn('Clients', 'lat'),
      queryInterface.removeColumn('Clients', 'lon'),
    ]);

    await Promise.all([
      queryInterface.addColumn('Clients', 'lat', {
        type: DataTypes.DECIMAL(3+8,8), allowNull: false, defaultValue: 0,
      }),
      queryInterface.addColumn('Clients', 'lon', {
        type: DataTypes.DECIMAL(3+8,8), allowNull: false, defaultValue: 0,
      }),
    ]);

    return await queryInterface.sequelize.query(`update Clients set lat=49.8478, lon=24.0258`);

  },
  down: async(queryInterface, Sequelize) => {

    await Promise.all([
      queryInterface.removeColumn('Clients', 'lat'),
      queryInterface.removeColumn('Clients', 'lon'),
    ]);

    await Promise.all([
      queryInterface.addColumn('Clients', 'lat', {
        type: DataTypes.STRING, allowNull: true, defaultValue: 0,
      }),
      queryInterface.addColumn('Clients', 'lon', {
        type: DataTypes.STRING, allowNull: true, defaultValue: 0,
      }),
    ]);

    return await queryInterface.sequelize.query(`update Clients set lat=49.8478, lon=24.0258`);

  }
};
