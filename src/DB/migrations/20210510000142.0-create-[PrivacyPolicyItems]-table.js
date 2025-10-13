'use strict';

const { DataTypes } = require('sequelize');

module.exports = {
  up: (queryInterface, Sequelize) => {

    return queryInterface.createTable('PrivacyPolicyItems', {
      id: {
        type: DataTypes.BIGINT(8).UNSIGNED,
        allowNull: false, autoIncrement: true, primaryKey: true,
      },

      privacyPolicyId: {
        type: DataTypes.BIGINT(8).UNSIGNED,
        allowNull: false,
        required: true,
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
        references: {
          model: 'PrivacyPolicies',
          key: 'id'
        },
      },
      itemTitle: {
        type: DataTypes.STRING, allowNull: false, defaultValue: ''
      },
      itemText: {
        type: DataTypes.TEXT, allowNull: false, defaultValue: ''
      },
      isDeleted: {
        type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false,
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
    return queryInterface.dropTable('PrivacyPolicyItems');
  }
};
