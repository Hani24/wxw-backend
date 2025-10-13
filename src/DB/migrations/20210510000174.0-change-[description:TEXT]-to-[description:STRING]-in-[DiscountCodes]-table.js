'use strict';

const { DataTypes } = require('sequelize');

module.exports = {
  up: (queryInterface, Sequelize) => {
    return Promise.all([
      queryInterface.changeColumn('DiscountCodes', 'description', {
        type: DataTypes.STRING, allowNull: true, defaultValue: ''
      }),
    ]);
  },
  down: (queryInterface, Sequelize) => {
    return Promise.all([
      queryInterface.changeColumn('DiscountCodes', 'description', {
        type: DataTypes.TEXT, allowNull: true, defaultValue: ''
      }),
    ]);
  }
};
