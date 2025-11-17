'use strict';

const { DataTypes } = require('sequelize');

module.exports = {
  up: async (queryInterface, Sequelize) => {

    await queryInterface.createTable('PostComments', {
      id: {
        type: DataTypes.BIGINT(8).UNSIGNED,
        allowNull: false, autoIncrement: true, primaryKey: true,
      },
      postId: {
        type: DataTypes.BIGINT(8).UNSIGNED,
        allowNull: false,
        required: true,
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
        references: {
          model: 'RestaurantPosts',
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
      comment: {
        type: DataTypes.TEXT, allowNull: false, defaultValue: '',
      },
      isDeleted: {
        type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false,
      },
      deletedAt: {
        type: DataTypes.DATE, allowNull: true, defaultValue: null,
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

    // Add indexes for performance
    await queryInterface.addIndex('PostComments', ['postId', 'createdAt']);
    await queryInterface.addIndex('PostComments', ['clientId']);

  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('PostComments');
  }
};
