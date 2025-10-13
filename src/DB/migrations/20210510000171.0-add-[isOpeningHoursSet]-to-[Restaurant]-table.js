'use strict';

const { DataTypes } = require('sequelize');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // [inner][stripe]
    await queryInterface.addColumn('Restaurants', 'isOpeningHoursSet', {
      type: DataTypes.BOOLEAN, allowNull: true, defaultValue: false,
    });
    return await queryInterface.sequelize.query('update Restaurants set isOpeningHoursSet=1');
  },
  down: (queryInterface, Sequelize) => {
    return Promise.all([
      queryInterface.removeColumn('Restaurants', 'isOpeningHoursSet'),
    ]);
  }
};
