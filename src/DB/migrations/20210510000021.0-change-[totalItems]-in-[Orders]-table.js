'use strict';

const { DataTypes } = require('sequelize');

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.changeColumn('Orders', 'totalItems', {
      type: DataTypes.INTEGER.UNSIGNED, allowNull: false, defaultValue: 0
    });
  },
  down: (queryInterface, Sequelize) => {
    return queryInterface.changeColumn('Orders','totalItems',{
      type: DataTypes.INTEGER, allowNull: false, defaultValue: 0      
    });
  }
};
