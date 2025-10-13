'use strict';

const { DataTypes } = require('sequelize');

module.exports = {
  up: (queryInterface, Sequelize) => {
    return Promise.all([
      queryInterface.removeColumn('CourierShifts', 'startAt'),
      queryInterface.removeColumn('CourierShifts', 'endAt'),
      queryInterface.addColumn('CourierShifts', 'isStarted', {
        type: DataTypes.BOOLEAN, allowNull: true, defaultValue: false
      }),
      queryInterface.addColumn('CourierShifts', 'startedAt', {
        type: DataTypes.DATE, allowNull: true, defaultValue: null
      }),
      queryInterface.addColumn('CourierShifts', 'isEnded', {
        type: DataTypes.BOOLEAN, allowNull: true, defaultValue: false
      }),
      queryInterface.addColumn('CourierShifts', 'endedAt', {
        type: DataTypes.DATE, allowNull: true, defaultValue: null
      }),
    ]);
  },
  down: (queryInterface, Sequelize) => {
    return Promise.all([
      queryInterface.removeColumn('CourierShifts', 'isStarted'),
      queryInterface.removeColumn('CourierShifts', 'startedAt'),
      queryInterface.removeColumn('CourierShifts', 'isEnded'),
      queryInterface.removeColumn('CourierShifts', 'endedAt'),
      queryInterface.addColumn('CourierShifts', 'startAt', {
        type: DataTypes.DATE, allowNull: true, defaultValue: null
      }),
      queryInterface.addColumn('CourierShifts', 'endAt', {
        type: DataTypes.DATE, allowNull: true, defaultValue: null
      }),
    ]);
  }
};
