'use strict';

const { DataTypes } = require('sequelize');

module.exports = {
  up: (queryInterface, Sequelize) => {

    return queryInterface.createTable('MasterNodes', {
      id: {
        type: DataTypes.BIGINT(8).UNSIGNED,
        allowNull: false, autoIncrement: true, primaryKey: true,
      },

      nuid: {
        type: DataTypes.STRING, allowNull: false, unique: true, required: true,
      },
      ip: {
        type: DataTypes.STRING, allowNull: true, defaultValue: 'n/a',
      },
      lastSeenAt: {
        type: DataTypes.DATE, allowNull: true, defaultValue: null,
      },
      isLocked: {
        type: DataTypes.BOOLEAN, allowNull: true, defaultValue: false,
      },
      lockedAt: {
        type: DataTypes.DATE, allowNull: true, defaultValue: null
      },
      isDeleted: {
        type: DataTypes.BOOLEAN, allowNull: true, defaultValue: false,
      },
      deletedAt: {
        type: DataTypes.DATE, allowNull: true, defaultValue: null
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
    return queryInterface.dropTable('MasterNodes');
  }
};
