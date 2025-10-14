'use strict';

/**
 * Demo Menu Categories Seeder
 * Creates menu categories for each restaurant
 */

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const now = new Date();

    // Get restaurant IDs
    const restaurants = await queryInterface.sequelize.query(
      `SELECT id, name FROM Restaurants ORDER BY id`,
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );

    const categories = [
      // Restaurant 1 - Delicious Burgers & More
      { restaurantId: restaurants[0].id, name: 'Burgers', description: 'Our signature burgers made with premium beef', order: 1, createdAt: now, updatedAt: now },
      { restaurantId: restaurants[0].id, name: 'Sides', description: 'Delicious sides to complement your meal', order: 2, createdAt: now, updatedAt: now },
      { restaurantId: restaurants[0].id, name: 'Drinks', description: 'Refreshing beverages', order: 3, createdAt: now, updatedAt: now },
      { restaurantId: restaurants[0].id, name: 'Desserts', description: 'Sweet treats to finish your meal', order: 4, createdAt: now, updatedAt: now },

      // Restaurant 2 - Italian Pizza House
      { restaurantId: restaurants[1].id, name: 'Classic Pizzas', description: 'Traditional Italian pizzas', order: 1, createdAt: now, updatedAt: now },
      { restaurantId: restaurants[1].id, name: 'Specialty Pizzas', description: 'Our unique creations', order: 2, createdAt: now, updatedAt: now },
      { restaurantId: restaurants[1].id, name: 'Pasta', description: 'Fresh homemade pasta dishes', order: 3, createdAt: now, updatedAt: now },
      { restaurantId: restaurants[1].id, name: 'Appetizers', description: 'Start your meal right', order: 4, createdAt: now, updatedAt: now },

      // Restaurant 3 - Tokyo Sushi & Asian Fusion
      { restaurantId: restaurants[2].id, name: 'Sushi Rolls', description: 'Fresh sushi rolls made to order', order: 1, createdAt: now, updatedAt: now },
      { restaurantId: restaurants[2].id, name: 'Sashimi', description: 'Premium fresh fish', order: 2, createdAt: now, updatedAt: now },
      { restaurantId: restaurants[2].id, name: 'Hot Dishes', description: 'Cooked Japanese specialties', order: 3, createdAt: now, updatedAt: now },
      { restaurantId: restaurants[2].id, name: 'Soups & Salads', description: 'Light and healthy options', order: 4, createdAt: now, updatedAt: now },

      // Restaurant 4 - El Loco Taco Truck
      { restaurantId: restaurants[3].id, name: 'Tacos', description: 'Authentic street tacos', order: 1, createdAt: now, updatedAt: now },
      { restaurantId: restaurants[3].id, name: 'Burritos', description: 'Huge burritos packed with flavor', order: 2, createdAt: now, updatedAt: now },
      { restaurantId: restaurants[3].id, name: 'Quesadillas', description: 'Melty cheese and your choice of filling', order: 3, createdAt: now, updatedAt: now },
      { restaurantId: restaurants[3].id, name: 'Extras', description: 'Sides and drinks', order: 4, createdAt: now, updatedAt: now },
    ];

    await queryInterface.bulkInsert('MenuCategories', categories, {});

    console.log('✅ Demo menu categories created successfully!');
    console.log('📋 16 categories added across 4 restaurants');
  },

  down: async (queryInterface, Sequelize) => {
    // Get restaurant IDs to delete their categories
    const restaurants = await queryInterface.sequelize.query(
      `SELECT id FROM Restaurants WHERE name IN ('Delicious Burgers & More', 'Italian Pizza House', 'Tokyo Sushi & Asian Fusion', 'El Loco Taco Truck')`,
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );

    const restaurantIds = restaurants.map(r => r.id);

    await queryInterface.bulkDelete('MenuCategories', {
      restaurantId: {
        [Sequelize.Op.in]: restaurantIds
      }
    }, {});

    console.log('✅ Demo menu categories removed successfully!');
  }
};
