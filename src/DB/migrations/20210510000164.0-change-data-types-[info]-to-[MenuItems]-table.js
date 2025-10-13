'use strict';

const { DataTypes } = require('sequelize');

module.exports = {
  up: (queryInterface, Sequelize) => {
    return Promise.all([
      queryInterface.changeColumn('MenuItems', 'kcal', {
        type: DataTypes.INTEGER.UNSIGNED, allowNull: true, defaultValue: null
      }),
      queryInterface.changeColumn('MenuItems', 'proteins', {
        type: DataTypes.INTEGER.UNSIGNED, allowNull: true, defaultValue: null
      }),
      queryInterface.changeColumn('MenuItems', 'fats', {
        type: DataTypes.INTEGER.UNSIGNED, allowNull: true, defaultValue: null
      }),
      queryInterface.changeColumn('MenuItems', 'carbs', {
        type: DataTypes.INTEGER.UNSIGNED, allowNull: true, defaultValue: null
      }),
    ]);
  },
  down: (queryInterface, Sequelize) => {
    return Promise.all([
      queryInterface.changeColumn('MenuItems', 'kcal', {
        type: DataTypes.INTEGER.UNSIGNED, allowNull: false, defaultValue: 0
      }),
      queryInterface.changeColumn('MenuItems', 'proteins', {
        type: DataTypes.INTEGER.UNSIGNED, allowNull: false, defaultValue: 0
      }),
      queryInterface.changeColumn('MenuItems', 'fats', {
        type: DataTypes.INTEGER.UNSIGNED, allowNull: false, defaultValue: 0
      }),
      queryInterface.changeColumn('MenuItems', 'carbs', {
        type: DataTypes.INTEGER.UNSIGNED, allowNull: false, defaultValue: 0
      }),
    ]);
  }
};
