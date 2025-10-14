'use strict';

/**
 * Link Users to Restaurants Seeder
 * Updates restaurant owner users to have restaurantId set
 * This is needed for the restaurant login to work properly
 */

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Get all restaurants with their user IDs
    const restaurants = await queryInterface.sequelize.query(
      `SELECT id, userId FROM Restaurants ORDER BY id`,
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );

    // Update each user's restaurantId field
    for (const restaurant of restaurants) {
      await queryInterface.sequelize.query(
        `UPDATE Users SET restaurantId = ? WHERE id = ?`,
        {
          replacements: [restaurant.id, restaurant.userId],
          type: queryInterface.sequelize.QueryTypes.UPDATE
        }
      );
    }

    console.log(`Updated ${restaurants.length} restaurant owner users with restaurantId`);
  },

  down: async (queryInterface, Sequelize) => {
    // Reset restaurantId for restaurant owner users
    await queryInterface.sequelize.query(
      `UPDATE Users SET restaurantId = NULL WHERE role = 'restaurant'`,
      { type: queryInterface.sequelize.QueryTypes.UPDATE }
    );
  }
};
