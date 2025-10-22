'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Get all existing restaurants
    const [restaurants] = await queryInterface.sequelize.query(
      `SELECT id FROM Restaurants WHERE isDeleted = false OR isDeleted IS NULL`
    );

    if (restaurants.length === 0) {
      console.log('No restaurants found to seed order type settings');
      return;
    }

    // Create order-now settings for all existing restaurants (enabled by default)
    const orderTypeSettings = restaurants.map(restaurant => ({
      restaurantId: restaurant.id,
      orderType: 'order-now',
      isEnabled: true,
      pricingModel: null,
      basePrice: null,
      pricePerPerson: null,
      pricePerHour: null,
      minPeople: null,
      maxPeople: null,
      minHours: null,
      maxHours: null,
      serviceFeePercentage: 15.00,
      createdAt: new Date(),
      updatedAt: new Date(),
    }));

    await queryInterface.bulkInsert('RestaurantOrderTypeSettings', orderTypeSettings);

    console.log(`Successfully seeded order-now settings for ${restaurants.length} restaurants`);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('RestaurantOrderTypeSettings', {
      orderType: 'order-now'
    });
  }
};
