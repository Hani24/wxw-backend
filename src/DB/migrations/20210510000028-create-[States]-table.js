'use strict';

const { DataTypes } = require('sequelize');

module.exports = {
  up: (queryInterface, Sequelize) => {

    return queryInterface.createTable('States', {
      id: {
        type: DataTypes.BIGINT(8).UNSIGNED,
        allowNull: false, autoIncrement: true, primaryKey: true,
      },

      name: {
        type: DataTypes.STRING, allowNull: false, unique: true,
      },
      code: {
        type: DataTypes.STRING, allowNull: true, defaultValue: 'n/a', 
      },
      isEnabled: {
        type: DataTypes.BOOLEAN, allowNull: true, defaultValue: true,
      },

      createdAt: {
        type: DataTypes.DATE, 
        allowNull: false, defaultValue: DataTypes.NOW
      },
      updatedAt: {
        type: DataTypes.DATE, 
        allowNull: false, defaultValue: DataTypes.NOW
      },
    });

  },
  down: (queryInterface, Sequelize) => {
    return queryInterface.dropTable('States');
  }
};
