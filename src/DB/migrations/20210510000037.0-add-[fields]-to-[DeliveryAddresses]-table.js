'use strict';

const { DataTypes } = require('sequelize');

module.exports = {
  up: (queryInterface, Sequelize) => {
    return Promise.all([
      queryInterface.addColumn('DeliveryAddresses', 'isOneTimeAddress', {
        type: DataTypes.BOOLEAN, allowNull: true, defaultValue: false,
      }),
    ]);
  },
  down: (queryInterface, Sequelize) => {
    return Promise.all([
      queryInterface.removeColumn('DeliveryAddresses', 'isOneTimeAddress'),
    ]);
  }
};
