'use strict';

/**
 * Migration: Create RestaurantCuisines junction table
 * Links restaurants to their cuisine types (many-to-many relationship)
 */

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('RestaurantCuisines', {
      id: {
        type: Sequelize.BIGINT(8).UNSIGNED,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true,
      },
      restaurantId: {
        type: Sequelize.BIGINT(8).UNSIGNED,
        allowNull: false,
        references: {
          model: 'Restaurants',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      cuisineTypeId: {
        type: Sequelize.BIGINT(8).UNSIGNED,
        allowNull: false,
        references: {
          model: 'CuisineTypes',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'),
      },
    });

    // Add composite unique index to prevent duplicate restaurant-cuisine pairs
    await queryInterface.addIndex('RestaurantCuisines', ['restaurantId', 'cuisineTypeId'], {
      unique: true,
      name: 'restaurant_cuisines_unique_idx',
    });

    // Add indexes for faster lookups
    await queryInterface.addIndex('RestaurantCuisines', ['restaurantId'], {
      name: 'restaurant_cuisines_restaurant_id_idx',
    });

    await queryInterface.addIndex('RestaurantCuisines', ['cuisineTypeId'], {
      name: 'restaurant_cuisines_cuisine_type_id_idx',
    });

    console.log('✅ RestaurantCuisines junction table created successfully');
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('RestaurantCuisines');
    console.log('✅ RestaurantCuisines table dropped');
  }
};
