'use strict';

const { DataTypes } = require('sequelize');

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable('CommentLikes', {
      id: {
        type: DataTypes.BIGINT(8).UNSIGNED,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true,
      },
      commentId: {
        type: DataTypes.BIGINT(8).UNSIGNED,
        allowNull: false,
        references: {
          model: 'PostComments',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      userId: {
        type: DataTypes.BIGINT(8).UNSIGNED,
        allowNull: false,
        references: {
          model: 'Users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      userType: {
        type: Sequelize.ENUM('client', 'restaurant'),
        allowNull: false,
      },
      createdAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updatedAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'),
      },
    }).then(() => {
      // Create unique index to prevent duplicate likes
      return queryInterface.addIndex('CommentLikes', ['commentId', 'userId', 'userType'], {
        unique: true,
        name: 'unique_comment_like'
      });
    }).then(() => {
      // Create indexes for better query performance
      return queryInterface.addIndex('CommentLikes', ['commentId']);
    }).then(() => {
      return queryInterface.addIndex('CommentLikes', ['userId', 'userType']);
    });
  },
  down: (queryInterface, Sequelize) => {
    return queryInterface.dropTable('CommentLikes');
  }
};
