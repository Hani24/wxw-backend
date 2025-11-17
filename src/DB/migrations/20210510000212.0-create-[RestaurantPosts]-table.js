'use strict';

const { DataTypes } = require('sequelize');

module.exports = {
  up: async (queryInterface, Sequelize) => {

    const POST_TYPES = ['post', 'event'];

    await queryInterface.createTable('RestaurantPosts', {
      id: {
        type: DataTypes.BIGINT(8).UNSIGNED,
        allowNull: false, autoIncrement: true, primaryKey: true,
      },
      restaurantId: {
        type: DataTypes.BIGINT(8).UNSIGNED,
        allowNull: false,
        required: true,
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
        references: {
          model: 'Restaurants',
          key: 'id'
        },
      },
      title: {
        type: DataTypes.STRING(255), allowNull: false, defaultValue: '',
      },
      content: {
        type: DataTypes.TEXT, allowNull: false, defaultValue: '',
      },
      image: {
        type: DataTypes.STRING, allowNull: true, defaultValue: null,
      },
      postType: {
        type: Sequelize.ENUM('post', 'event'),
        defaultValue: 'post',
        allowNull: false,
      },
      // Event-specific fields
      eventDate: {
        type: DataTypes.DATEONLY, allowNull: true, defaultValue: null,
      },
      eventStartTime: {
        type: DataTypes.TIME, allowNull: true, defaultValue: null,
      },
      eventEndTime: {
        type: DataTypes.TIME, allowNull: true, defaultValue: null,
      },
      eventLocation: {
        type: DataTypes.STRING(255), allowNull: true, defaultValue: null,
      },
      // Engagement metrics
      totalLikes: {
        type: DataTypes.INTEGER.UNSIGNED, allowNull: false, defaultValue: 0,
      },
      totalComments: {
        type: DataTypes.INTEGER.UNSIGNED, allowNull: false, defaultValue: 0,
      },
      // Visibility & Status
      isPublished: {
        type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true,
      },
      publishedAt: {
        type: DataTypes.DATE, allowNull: true, defaultValue: null,
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
    await queryInterface.addIndex('RestaurantPosts', ['restaurantId']);
    await queryInterface.addIndex('RestaurantPosts', ['postType']);
    await queryInterface.addIndex('RestaurantPosts', ['eventDate']);
    await queryInterface.addIndex('RestaurantPosts', ['publishedAt']);
    await queryInterface.addIndex('RestaurantPosts', ['isPublished', 'isDeleted']);

  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('RestaurantPosts');
  }
};
