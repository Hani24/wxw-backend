'use strict';

const { DataTypes } = require('sequelize');

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.addColumn('Orders', 'clientDescription', {
      type: DataTypes.TEXT, allowNull: true, defaultValue: '',
    });
  },
  down: (queryInterface, Sequelize) => {
    return queryInterface.removeColumn('Orders', 'clientDescription');
  }
};
