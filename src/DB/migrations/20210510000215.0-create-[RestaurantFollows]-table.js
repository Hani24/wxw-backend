'use strict';

const { DataTypes } = require('sequelize');

module.exports = {
  up: async (queryInterface, Sequelize) => {

    await queryInterface.createTable('RestaurantFollows', {
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
    await queryInterface.addIndex('RestaurantFollows', ['restaurantId']);
    await queryInterface.addIndex('RestaurantFollows', ['clientId']);
    // Unique constraint to prevent duplicate follows
    await queryInterface.addIndex('RestaurantFollows', ['restaurantId', 'clientId'], { unique: true });

  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('RestaurantFollows');
  }
};
