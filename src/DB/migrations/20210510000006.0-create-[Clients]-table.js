'use strict';

const { DataTypes } = require('sequelize');

module.exports = {
  up: (queryInterface, Sequelize) => {

    return queryInterface.createTable('Clients', {
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
      isRestricted: {
        type: DataTypes.BOOLEAN, allowNull: true, defaultValue: false,
      },
      verifiedAt: {
        type: DataTypes.DATE, allowNull: true, defaultValue: null
      },
      restrictedAt: {
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
    return queryInterface.dropTable('Clients');
  }
};
