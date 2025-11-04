/**
 * Script to add catering settings and configure menu items for catering
 * Usage: node scripts/add-catering-to-restaurants.js [limit]
 * Example: node scripts/add-catering-to-restaurants.js 10
 *
 * This script will:
 * 1. Enable catering for specified number of restaurants
 * 2. Configure catering service fee percentage
 * 3. Make random menu items available for catering with feedsPeople values
 * 4. Set minimum quantities and lead time days for catering items
 * 5. Add sample unavailable dates to each restaurant
 */

const path = require('path');

// Load environment variables from .env file
require('dotenv').config();

// Determine environment
const nodeEnv = process.env.NODE_ENV || 'dev';
console.log(`\n🔧 Environment: ${nodeEnv}\n`);

// Sample unavailable dates configurations
const SAMPLE_UNAVAILABLE_DATES = [
  {
    // Holiday - Christmas 2025
    date: '2025-12-25',
    reason: 'Christmas Day - Closed for holiday',
  },
  {
    // Holiday - New Year 2026
    date: '2026-01-01',
    reason: 'New Year\'s Day - Closed for holiday',
  },
  {
    // Private event
    date: '2025-11-15',
    reason: 'Private catering event - Fully booked',
  },
  {
    // Maintenance
    date: '2025-12-10',
    reason: 'Kitchen maintenance and deep cleaning',
  },
  {
    // Staff training
    date: '2025-11-20',
    reason: 'Staff training day',
  },
];

// Catering menu item configurations
const CATERING_ITEM_CONFIGS = [
  {
    feedsPeople: 1,
    minimumQuantity: 10,
    leadTimeDays: 1,
    priceMultiplier: 1.0, // Same as regular price
  },
  {
    feedsPeople: 2,
    minimumQuantity: 5,
    leadTimeDays: 2,
    priceMultiplier: 1.8, // Slightly less than double
  },
  {
    feedsPeople: 5,
    minimumQuantity: 3,
    leadTimeDays: 3,
    priceMultiplier: 4.5, // Bulk discount
  },
  {
    feedsPeople: 10,
    minimumQuantity: 2,
    leadTimeDays: 5,
    priceMultiplier: 8.5, // Better bulk discount
  },
  {
    feedsPeople: 20,
    minimumQuantity: 1,
    leadTimeDays: 7,
    priceMultiplier: 16.0, // Large party size
  },
];

/**
 * Get random unavailable dates for a restaurant
 */
function getRandomUnavailableDates() {
  const numberOfDates = Math.floor(Math.random() * 3) + 2; // 2-4 dates
  const shuffled = [...SAMPLE_UNAVAILABLE_DATES].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, numberOfDates);
}

/**
 * Get random catering config for a menu item
 */
function getRandomCateringConfig() {
  const randomIndex = Math.floor(Math.random() * CATERING_ITEM_CONFIGS.length);
  return CATERING_ITEM_CONFIGS[randomIndex];
}

/**
 * Get random service fee percentage (between 12% and 20%)
 */
function getRandomServiceFee() {
  return (Math.random() * 8 + 12).toFixed(2); // 12.00 to 20.00
}

async function addCateringToRestaurants() {
  try {
    const limit = parseInt(process.argv[2]) || 5; // Default to 5 restaurants

    console.log(`📋 Configuration:`);
    console.log(`   Restaurants to configure: ${limit}`);
    console.log(`   Catering item configs: ${CATERING_ITEM_CONFIGS.length} options`);
    console.log(`   Sample dates pool: ${SAMPLE_UNAVAILABLE_DATES.length}`);
    console.log(``);

    // Load environment config
    const envPath = path.resolve(__dirname, `../src/envs/${nodeEnv}`);
    const configModule = require(`${envPath}/sequelize.config.js`);
    const config = configModule[nodeEnv];

    // Initialize Sequelize
    const { Sequelize } = require('sequelize');
    const sequelize = new Sequelize(
      config.database,
      config.username,
      config.password,
      {
        host: config.host,
        port: config.port,
        dialect: config.dialect,
        logging: false
      }
    );

    // Test connection
    await sequelize.authenticate();
    console.log('✅ Database connected\n');

    // Get active verified restaurants
    const [restaurants] = await sequelize.query(
      `SELECT id, name, email FROM Restaurants
       WHERE isDeleted = 0 AND isVerified = 1 AND isRestricted = 0
       LIMIT ?`,
      { replacements: [limit] }
    );

    if (!restaurants || restaurants.length === 0) {
      console.error(`❌ No verified restaurants found`);
      await sequelize.close();
      process.exit(1);
    }

    console.log(`🏪 Found ${restaurants.length} restaurants to configure\n`);

    let successCount = 0;
    let skipCount = 0;
    let errorCount = 0;

    for (const restaurant of restaurants) {
      console.log(`\n${'='.repeat(60)}`);
      console.log(`🏪 Restaurant: ${restaurant.name || 'Unnamed'} (ID: ${restaurant.id})`);
      console.log(`${'='.repeat(60)}\n`);

      try {
        // Check if catering already enabled
        const [existingSettings] = await sequelize.query(
          `SELECT * FROM RestaurantOrderTypeSettings
           WHERE restaurantId = ? AND orderType = 'catering'`,
          { replacements: [restaurant.id] }
        );

        if (existingSettings && existingSettings.length > 0 && existingSettings[0].isEnabled) {
          console.log(`   ⏭️  Catering already enabled - skipping`);
          skipCount++;
          continue;
        }

        // Get random service fee
        const serviceFeePercentage = getRandomServiceFee();
        console.log(`   💰 Service Fee: ${serviceFeePercentage}%`);

        // Delete existing settings if present (to update)
        await sequelize.query(
          `DELETE FROM RestaurantOrderTypeSettings
           WHERE restaurantId = ? AND orderType = 'catering'`,
          { replacements: [restaurant.id] }
        );

        // Insert catering settings
        await sequelize.query(
          `INSERT INTO RestaurantOrderTypeSettings
           (restaurantId, orderType, isEnabled, serviceFeePercentage, createdAt, updatedAt)
           VALUES (?, 'catering', 1, ?, NOW(), NOW())`,
          {
            replacements: [restaurant.id, serviceFeePercentage]
          }
        );

        console.log(`   ✅ Catering enabled`);

        // Get menu items for this restaurant
        const [menuItems] = await sequelize.query(
          `SELECT id, name, price FROM MenuItems
           WHERE restaurantId = ? AND isAvailable = 1 AND isDeleted = 0
           LIMIT 20`,
          { replacements: [restaurant.id] }
        );

        if (!menuItems || menuItems.length === 0) {
          console.log(`   ⚠️  No menu items found for this restaurant`);
        } else {
          console.log(`\n   🍽️  Found ${menuItems.length} menu items`);

          // Randomly select 30-70% of menu items to make available for catering
          const percentageToEnable = Math.random() * 0.4 + 0.3; // 30% to 70%
          const numItemsToEnable = Math.max(1, Math.floor(menuItems.length * percentageToEnable));
          const shuffledItems = [...menuItems].sort(() => 0.5 - Math.random());
          const itemsToEnable = shuffledItems.slice(0, numItemsToEnable);

          console.log(`   📦 Enabling ${itemsToEnable.length} items for catering:\n`);

          let itemsConfigured = 0;

          for (const menuItem of itemsToEnable) {
            try {
              // Check if already exists
              const [existing] = await sequelize.query(
                `SELECT id FROM CateringMenuItems WHERE menuItemId = ?`,
                { replacements: [menuItem.id] }
              );

              if (existing && existing.length > 0) {
                console.log(`      ⏭️  ${menuItem.name} - Already exists, skipping`);
                continue;
              }

              const config = getRandomCateringConfig();

              // Calculate catering price if needed
              const cateringPrice = menuItem.price
                ? (parseFloat(menuItem.price) * config.priceMultiplier).toFixed(2)
                : null;

              await sequelize.query(
                `INSERT INTO CateringMenuItems
                 (menuItemId, feedsPeople, minimumQuantity, leadTimeDays,
                  isAvailableForCatering, cateringPrice, isDeleted, createdAt, updatedAt)
                 VALUES (?, ?, ?, ?, 1, ?, 0, NOW(), NOW())`,
                {
                  replacements: [
                    menuItem.id,
                    config.feedsPeople,
                    config.minimumQuantity,
                    config.leadTimeDays,
                    cateringPrice
                  ]
                }
              );

              console.log(`      ✅ ${menuItem.name}`);
              console.log(`         - Feeds: ${config.feedsPeople} people`);
              console.log(`         - Min Qty: ${config.minimumQuantity}`);
              console.log(`         - Lead Time: ${config.leadTimeDays} days`);
              if (cateringPrice) {
                console.log(`         - Catering Price: $${cateringPrice} (Regular: $${menuItem.price})`);
              }

              itemsConfigured++;
            } catch (itemError) {
              console.error(`      ❌ Error configuring ${menuItem.name}: ${itemError.message}`);
            }
          }

          console.log(`\n   📊 Configured ${itemsConfigured} menu items for catering`);
        }

        // Add unavailable dates
        const unavailableDates = getRandomUnavailableDates();
        console.log(`\n   📅 Adding ${unavailableDates.length} unavailable dates:`);

        for (const dateConfig of unavailableDates) {
          // Check if date already exists
          const [existing] = await sequelize.query(
            `SELECT id FROM RestaurantUnavailableDates
             WHERE restaurantId = ? AND unavailableDate = ?`,
            { replacements: [restaurant.id, dateConfig.date] }
          );

          if (existing && existing.length > 0) {
            console.log(`      ⏭️  ${dateConfig.date} - Already exists, skipping`);
            continue;
          }

          await sequelize.query(
            `INSERT INTO RestaurantUnavailableDates
             (restaurantId, unavailableDate, reason, isFullDayBlocked, createdAt, updatedAt)
             VALUES (?, ?, ?, 1, NOW(), NOW())`,
            { replacements: [restaurant.id, dateConfig.date, dateConfig.reason] }
          );

          console.log(`      ✅ ${dateConfig.date} - ${dateConfig.reason}`);
        }

        successCount++;
        console.log(`\n   🎉 Successfully configured restaurant for catering!`);

      } catch (error) {
        console.error(`   ❌ Error configuring restaurant: ${error.message}`);
        console.error(error);
        errorCount++;
      }
    }

    // Summary
    console.log(`\n\n${'='.repeat(60)}`);
    console.log(`📊 SUMMARY`);
    console.log(`${'='.repeat(60)}\n`);
    console.log(`   ✅ Successfully configured: ${successCount}`);
    console.log(`   ⏭️  Skipped (already enabled): ${skipCount}`);
    console.log(`   ❌ Errors: ${errorCount}`);
    console.log(`   📋 Total processed: ${restaurants.length}`);
    console.log(``);

    if (successCount > 0) {
      console.log(`🎉 Catering feature successfully added to ${successCount} restaurant(s)!`);
      console.log(``);
      console.log(`💡 You can now:`);
      console.log(`   - Create catering orders for these restaurants`);
      console.log(`   - Test the unavailable dates blocking functionality`);
      console.log(`   - Order menu items with different serving sizes (1-20 people)`);
      console.log(`   - Test minimum quantity requirements`);
      console.log(`   - Test lead time validation`);
    }

    await sequelize.close();
    process.exit(0);

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error);
    process.exit(1);
  }
}

addCateringToRestaurants();
