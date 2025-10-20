'use strict';

const { DataTypes } = require('sequelize');

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable('GuestSessions', {
      id: {
        type: DataTypes.BIGINT(8).UNSIGNED,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
      },
      guestToken: {
        type: DataTypes.STRING(64),
        allowNull: false,
        unique: true,
        required: true,
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
      clientId: {
        type: DataTypes.BIGINT(8).UNSIGNED,
        allowNull: false,
        required: true,
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
        references: {
          model: 'Clients',
          key: 'id'
        },
      },
      deviceId: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: '',
      },
      ip: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: 'n/a',
      },
      country: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: 'n/a',
      },
      timezone: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: 'n/a',
      },
      expiresAt: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      isConverted: {
        type: DataTypes.BOOLEAN,
        allowNull: true,
        defaultValue: false,
      },
      convertedAt: {
        type: DataTypes.DATE,
        allowNull: true,
        defaultValue: null,
      },
      isDeleted: {
        type: DataTypes.BOOLEAN,
        allowNull: true,
        defaultValue: false,
      },
      deletedAt: {
        type: DataTypes.DATE,
        allowNull: true,
        defaultValue: null,
      },
      createdAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
      },
      updatedAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
      },
    });
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.dropTable('GuestSessions');
  }
};
