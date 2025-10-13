'use strict';

const { DataTypes } = require('sequelize');

module.exports = {
  up: (queryInterface, Sequelize) => {

    return queryInterface.createTable('Sessions', {
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
      token: {
        type: DataTypes.STRING, allowNull: false, required: true,
      },
      maxAge: {
        type: DataTypes.INTEGER(11).UNSIGNED, allowNull: true, defaultValue: 0,
      },
      fcmPushToken: {
        type: DataTypes.STRING, allowNull: true, defaultValue: '', 
      },
      country: {
        type: DataTypes.STRING, allowNull: true, defaultValue: 'n/a',
      },
      timezone: {
        type: DataTypes.STRING, allowNull: true, defaultValue: 'n/a',
      },
      ip: {
        type: DataTypes.STRING, allowNull: true, defaultValue: 'n/a',
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
    return queryInterface.dropTable('Sessions');
  }
};
