'use strict';

/**
 * Demo Restaurants Seeder
 * Creates sample restaurants linked to manager users
 */

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const now = new Date();

    // Get the user IDs for managers
    const managers = await queryInterface.sequelize.query(
      `SELECT id, email FROM Users WHERE role = 'manager' ORDER BY id`,
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );

    const restaurants = [
      // Restaurant 1 - Burger Place (Manager: John Smith)
      {
        userId: managers[0].id, // manager.burgers@wxwdelivery.com
        cityId: 5987, // Auburn
        name: 'Delicious Burgers & More',
        description: 'The best burgers in town! Fresh ingredients, homemade buns, and premium beef. Try our signature bacon cheeseburger!',
        type: 'stationary',
        street: '123 Main St',
        zip: '36830',
        phone: '+12051234567',
        email: 'info@deliciousburgers.com',
        website: 'www.deliciousburgers.com',
        lat: 32.6099,
        lon: -85.4808,
        rating: 4.5,
        orderPrepTime: 25,
        isOpen: true,
        isVerified: true,
        verifiedAt: now,
        isRestricted: false,
        isDeleted: false,
        image: 'burger-restaurant.jpg',
        timezone: 'America/Chicago',
        totalOrders: 0,
        totalAcceptedOrders: 0,
        totalCanceledOrders: 0,
        totalIncomeInCent: 0,
        totalPreparationTimeInSeconds: 0,
        balance: 0,
        isKycCompleted: true,
        kycCompletedAt: now,
        isOpeningHoursSet: true,
        createdAt: now,
        updatedAt: now,
      },

      // Restaurant 2 - Pizza Place (Manager: Maria Garcia)
      {
        userId: managers[1].id, // manager.pizza@wxwdelivery.com
        cityId: 5987, // Auburn
        name: 'Italian Pizza House',
        description: 'Authentic Italian pizza made with love. Wood-fired oven, imported Italian ingredients, and traditional recipes from Naples.',
        type: 'stationary',
        street: '456 Oak Ave',
        zip: '36830',
        phone: '+12051234568',
        email: 'contact@italianpizza.com',
        website: 'www.italianpizza.com',
        lat: 32.6146,
        lon: -85.4897,
        rating: 4.8,
        orderPrepTime: 30,
        isOpen: true,
        isVerified: true,
        verifiedAt: now,
        isRestricted: false,
        isDeleted: false,
        image: 'pizza-restaurant.jpg',
        timezone: 'America/Chicago',
        totalOrders: 0,
        totalAcceptedOrders: 0,
        totalCanceledOrders: 0,
        totalIncomeInCent: 0,
        totalPreparationTimeInSeconds: 0,
        balance: 0,
        isKycCompleted: true,
        kycCompletedAt: now,
        isOpeningHoursSet: true,
        createdAt: now,
        updatedAt: now,
      },

      // Restaurant 3 - Sushi Place (Manager: David Chen)
      {
        userId: managers[2].id, // manager.sushi@wxwdelivery.com
        cityId: 5984, // Athens
        name: 'Tokyo Sushi & Asian Fusion',
        description: 'Fresh sushi daily! Experience authentic Japanese cuisine with a modern twist. All-you-can-eat sushi on Wednesdays!',
        type: 'stationary',
        street: '789 Elm St',
        zip: '35611',
        phone: '+12561234569',
        email: 'hello@tokyosushi.com',
        website: 'www.tokyosushi.com',
        lat: 34.8026,
        lon: -86.9719,
        rating: 4.7,
        orderPrepTime: 35,
        isOpen: true,
        isVerified: true,
        verifiedAt: now,
        isRestricted: false,
        isDeleted: false,
        image: 'sushi-restaurant.jpg',
        timezone: 'America/Chicago',
        totalOrders: 0,
        totalAcceptedOrders: 0,
        totalCanceledOrders: 0,
        totalIncomeInCent: 0,
        totalPreparationTimeInSeconds: 0,
        balance: 0,
        isKycCompleted: true,
        kycCompletedAt: now,
        isOpeningHoursSet: true,
        createdAt: now,
        updatedAt: now,
      },

      // Restaurant 4 - Mexican Food Truck (Manager: Carlos Rodriguez)
      {
        userId: managers[3].id, // manager.taco@wxwdelivery.com
        cityId: 5982, // Anniston
        name: 'El Loco Taco Truck',
        description: 'Authentic Mexican street food on wheels! Fresh tacos, burritos, quesadillas made to order. Find us at different locations daily!',
        type: 'mobile',
        street: '321 Maple Dr',
        zip: '36201',
        phone: '+12561234570',
        email: 'orders@ellocotaco.com',
        website: 'www.ellocotaco.com',
        lat: 33.6597,
        lon: -85.8316,
        rating: 4.6,
        orderPrepTime: 20,
        isOpen: true,
        isVerified: true,
        verifiedAt: now,
        isRestricted: false,
        isDeleted: false,
        image: 'taco-truck.jpg',
        timezone: 'America/Chicago',
        totalOrders: 0,
        totalAcceptedOrders: 0,
        totalCanceledOrders: 0,
        totalIncomeInCent: 0,
        totalPreparationTimeInSeconds: 0,
        balance: 0,
        isKycCompleted: true,
        kycCompletedAt: now,
        isOpeningHoursSet: true,
        createdAt: now,
        updatedAt: now,
      },
    ];

    await queryInterface.bulkInsert('Restaurants', restaurants, {});

    console.log('✅ Demo restaurants created successfully!');
    console.log('🍔 4 restaurants added:');
    console.log('   - Delicious Burgers & More (Auburn)');
    console.log('   - Italian Pizza House (Auburn)');
    console.log('   - Tokyo Sushi & Asian Fusion (Athens)');
    console.log('   - El Loco Taco Truck (Anniston - Mobile)');
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('Restaurants', {
      name: {
        [Sequelize.Op.in]: [
          'Delicious Burgers & More',
          'Italian Pizza House',
          'Tokyo Sushi & Asian Fusion',
          'El Loco Taco Truck'
        ]
      }
    }, {});

    console.log('✅ Demo restaurants removed successfully!');
  }
};
