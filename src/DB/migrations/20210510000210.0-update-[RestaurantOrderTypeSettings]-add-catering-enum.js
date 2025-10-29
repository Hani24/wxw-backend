'use strict';

/**
 * Migration: Add 'catering' to orderType enum in RestaurantOrderTypeSettings table
 * This allows restaurants to configure catering service settings
 */

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // MySQL doesn't support ALTER ENUM directly, so we need to modify the column
    // First, check if catering already exists in the enum
    const [results] = await queryInterface.sequelize.query(`
      SELECT COLUMN_TYPE
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'RestaurantOrderTypeSettings'
        AND COLUMN_NAME = 'orderType'
    `);

    if (results.length > 0) {
      const columnType = results[0].COLUMN_TYPE;

      // Check if 'catering' is already in the enum
      if (!columnType.includes("'catering'")) {
        // Modify the enum to add 'catering'
        await queryInterface.sequelize.query(`
          ALTER TABLE RestaurantOrderTypeSettings
          MODIFY COLUMN orderType ENUM('order-now', 'on-site-presence', 'catering') NOT NULL
        `);

        console.log('✓ Added "catering" to RestaurantOrderTypeSettings.orderType enum');
      } else {
        console.log('✓ "catering" already exists in RestaurantOrderTypeSettings.orderType enum');
      }
    }
  },

  down: async (queryInterface, Sequelize) => {
    // Remove 'catering' from the enum
    // Note: This will fail if any rows have orderType = 'catering'
    await queryInterface.sequelize.query(`
      ALTER TABLE RestaurantOrderTypeSettings
      MODIFY COLUMN orderType ENUM('order-now', 'on-site-presence') NOT NULL
    `);

    console.log('✓ Removed "catering" from RestaurantOrderTypeSettings.orderType enum');
  }
};
