'use strict';

const { DataTypes } = require('sequelize');

module.exports = {
  up: async(queryInterface, Sequelize) => {

    await queryInterface.dropTable('AccessRecoveries');

    return queryInterface.createTable('AccessRecoveries', {
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
      code: {
        type: DataTypes.STRING, allowNull: false, required: true,
      },
      maxAge: {
        type: DataTypes.INTEGER(11).UNSIGNED, allowNull: true, defaultValue: 0
      },
      isUsed: {
        type: DataTypes.BOOLEAN, allowNull: true, defaultValue: false,
      },
      usedAt: {
        type: DataTypes.DATE, allowNull: true, defaultValue: null,      
      },
      isExpired: {
        type: DataTypes.BOOLEAN, allowNull: true, defaultValue: false,
      },
      expiredAt: {
        type: DataTypes.DATE, allowNull: true, defaultValue: null,      
      },
      isResent: {
        type: DataTypes.BOOLEAN, allowNull: true, defaultValue: false,
      },
      resentAt: {
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
    return queryInterface.dropTable('AccessRecoveries');
  }
};
