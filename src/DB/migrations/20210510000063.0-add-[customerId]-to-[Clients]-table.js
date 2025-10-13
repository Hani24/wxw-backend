'use strict';

const { DataTypes } = require('sequelize');

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.addColumn('Clients', 'customerId', {
      type: DataTypes.STRING, allowNull: true, defaultValue: null
    });
  },
  down: (queryInterface, Sequelize) => {
    return queryInterface.removeColumn('Clients','customerId');
  }
};
