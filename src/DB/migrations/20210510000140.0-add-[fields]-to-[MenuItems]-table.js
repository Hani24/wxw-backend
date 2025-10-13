'use strict';

const { DataTypes } = require('sequelize');

module.exports = {
  up: (queryInterface, Sequelize) => {
    return Promise.all([
      queryInterface.addColumn('MenuItems', 'totalRatings', {
        type: DataTypes.BIGINT(8).UNSIGNED, allowNull: true, defaultValue: 0,
      }),
    ]);
  },
  down: (queryInterface, Sequelize) => {
    return Promise.all([
      queryInterface.removeColumn('MenuItems', 'totalRatings'),
    ]);
  }
};
