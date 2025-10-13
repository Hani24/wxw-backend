'use strict';

const { DataTypes } = require('sequelize');

module.exports = {
  up: (queryInterface, Sequelize) => {

    return queryInterface.createTable('Employees', {
      id: {
        type: DataTypes.BIGINT(8).UNSIGNED,
        allowNull: false, autoIncrement: true, primaryKey: true,
      },

      userId: {
        type: DataTypes.BIGINT(8).UNSIGNED,
        allowNull: false,
        required: true,
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
        references: {
          model: 'Users',
          key: 'id'
        },
      },
      isVerified: {
        type: DataTypes.BOOLEAN, allowNull: true, defaultValue: false,
      },
      verifiedAt: {
        type: DataTypes.DATE, allowNull: true, defaultValue: null
      },
      isRestricted: {
        type: DataTypes.BOOLEAN, allowNull: true, defaultValue: false,
      },
      restrictedAt: {
        type: DataTypes.DATE, allowNull: true, defaultValue: null
      },
      isDeleted: {
        type: DataTypes.BOOLEAN, allowNull: true, defaultValue: false,
      },
      deletedAt: {
        type: DataTypes.DATE, allowNull: true, defaultValue: null
      },
      lastOnlineAt: {
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
    return queryInterface.dropTable('Employees');
  }
};
