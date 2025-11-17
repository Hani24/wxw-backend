'use strict';

const { DataTypes } = require('sequelize');

module.exports = {
  up: async (queryInterface, Sequelize) => {

    await queryInterface.createTable('PostLikes', {
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
    await queryInterface.addIndex('PostLikes', ['postId']);
    await queryInterface.addIndex('PostLikes', ['clientId']);
    // Unique constraint to prevent duplicate likes
    await queryInterface.addIndex('PostLikes', ['postId', 'clientId'], { unique: true });

  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('PostLikes');
  }
};
