'use strict';

/**
 * Demo Restaurant Cuisines Seeder
 * Links restaurants to their cuisine types
 */

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const now = new Date();

    // Get all cuisine types
    const cuisineTypes = await queryInterface.sequelize.query(
      `SELECT id, slug FROM CuisineTypes`,
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );

    // Helper to find cuisine ID by slug
    const getCuisineId = (slug) => {
      const cuisine = cuisineTypes.find(c => c.slug === slug);
      return cuisine ? cuisine.id : null;
    };

    // Get all restaurants
    const restaurants = await queryInterface.sequelize.query(
      `SELECT id, name FROM Restaurants ORDER BY id`,
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );

    // Helper to find restaurant ID by name
    const getRestaurantId = (name) => {
      const restaurant = restaurants.find(r => r.name === name);
      return restaurant ? restaurant.id : null;
    };

    const restaurantCuisines = [
      // Food Truck - American, Fast Food
      {
        restaurantId: getRestaurantId('Food Truck'),
        cuisineTypeId: getCuisineId('american'),
        createdAt: now,
        updatedAt: now,
      },
      {
        restaurantId: getRestaurantId('Food Truck'),
        cuisineTypeId: getCuisineId('fast-food'),
        createdAt: now,
        updatedAt: now,
      },

      // Stationary restaurant - American, Fast Food
      {
        restaurantId: getRestaurantId('Stationary restaurant'),
        cuisineTypeId: getCuisineId('italian'),
        createdAt: now,
        updatedAt: now,
      },
      {
        restaurantId: getRestaurantId('Stationary restaurant'),
        cuisineTypeId: getCuisineId('fast-food'),
        createdAt: now,
        updatedAt: now,
      },
      
      // Chao min - American, Fast Food
      {
        restaurantId: getRestaurantId('Chao min'),
        cuisineTypeId: getCuisineId('italian'),
        createdAt: now,
        updatedAt: now,
      },
      {
        restaurantId: getRestaurantId('Chao min'),
        cuisineTypeId: getCuisineId('mexican'),
        createdAt: now,
        updatedAt: now,
      },
      
      // Original Tommy's  Hamburgers - American, Fast Food
      {
        restaurantId: getRestaurantId(`Original Tommy's  Hamburgers`),
        cuisineTypeId: getCuisineId('italian'),
        createdAt: now,
        updatedAt: now,
      },
      // Delicious Burgers & More - American, Fast Food
      {
        restaurantId: getRestaurantId('Delicious Burgers & More'),
        cuisineTypeId: getCuisineId('american'),
        createdAt: now,
        updatedAt: now,
      },
      {
        restaurantId: getRestaurantId('Delicious Burgers & More'),
        cuisineTypeId: getCuisineId('fast-food'),
        createdAt: now,
        updatedAt: now,
      },

      // Italian Pizza House - Italian, Pizza
      {
        restaurantId: getRestaurantId('Italian Pizza House'),
        cuisineTypeId: getCuisineId('italian'),
        createdAt: now,
        updatedAt: now,
      },
      {
        restaurantId: getRestaurantId('Italian Pizza House'),
        cuisineTypeId: getCuisineId('pizza'),
        createdAt: now,
        updatedAt: now,
      },

      // Tokyo Sushi & Asian Fusion - Japanese, Asian Fusion
      {
        restaurantId: getRestaurantId('Tokyo Sushi & Asian Fusion'),
        cuisineTypeId: getCuisineId('japanese'),
        createdAt: now,
        updatedAt: now,
      },
      {
        restaurantId: getRestaurantId('Tokyo Sushi & Asian Fusion'),
        cuisineTypeId: getCuisineId('asian-fusion'),
        createdAt: now,
        updatedAt: now,
      },

      // El Loco Taco Truck - Mexican
      {
        restaurantId: getRestaurantId('El Loco Taco Truck'),
        cuisineTypeId: getCuisineId('mexican'),
        createdAt: now,
        updatedAt: now,
      },
    ];

    // Filter out any nulls (in case restaurants or cuisines don't exist)
    const validRestaurantCuisines = restaurantCuisines.filter(
      rc => rc.restaurantId && rc.cuisineTypeId
    );

    if (validRestaurantCuisines.length > 0) {
      await queryInterface.bulkInsert('RestaurantCuisines', validRestaurantCuisines, {});

      console.log('✅ Restaurant cuisine types linked successfully!');
      console.log(`🔗 ${validRestaurantCuisines.length} restaurant-cuisine links created`);
    } else {
      console.log('⚠️  No valid restaurant-cuisine links to create');
    }
  },

  down: async (queryInterface, Sequelize) => {
    // Get restaurant IDs to delete their cuisine links
    const restaurants = await queryInterface.sequelize.query(
      `SELECT id FROM Restaurants WHERE name IN ('Delicious Burgers & More', 'Italian Pizza House', 'Tokyo Sushi & Asian Fusion', 'El Loco Taco Truck')`,
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );

    const restaurantIds = restaurants.map(r => r.id);

    if (restaurantIds.length > 0) {
      await queryInterface.bulkDelete('RestaurantCuisines', {
        restaurantId: {
          [Sequelize.Op.in]: restaurantIds
        }
      }, {});

      console.log('✅ Restaurant cuisine links removed successfully!');
    }
  }
};
