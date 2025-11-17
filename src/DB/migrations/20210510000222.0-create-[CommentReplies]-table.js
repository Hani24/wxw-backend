'use strict';

const { DataTypes } = require('sequelize');

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable('CommentReplies', {
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
      reply: {
        type: DataTypes.TEXT,
        allowNull: false,
        defaultValue: '',
      },
      isDeleted: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
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
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updatedAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'),
      },
    }).then(() => {
      // Create indexes for better query performance
      return queryInterface.addIndex('CommentReplies', ['commentId', 'isDeleted']);
    }).then(() => {
      return queryInterface.addIndex('CommentReplies', ['userId', 'userType']);
    });
  },
  down: (queryInterface, Sequelize) => {
    return queryInterface.dropTable('CommentReplies');
  }
};
