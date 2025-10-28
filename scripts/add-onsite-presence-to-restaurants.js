/**
 * Script to add on-site presence settings and sample unavailable dates to restaurants
 * Usage: node scripts/add-onsite-presence-to-restaurants.js [limit]
 * Example: node scripts/add-onsite-presence-to-restaurants.js 10
 *
 * This script will:
 * 1. Enable on-site presence for specified number of restaurants
 * 2. Configure different pricing models (per-person, per-hour, per-event)
 * 3. Add sample unavailable dates to each restaurant
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
    reason: 'Private wedding event - Fully booked',
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

// Pricing models configurations
const PRICING_MODELS = [
  {
    name: 'per-person',
    settings: {
      pricingModel: 'per-person',
      pricePerPerson: 45.00,
      basePrice: 0,
      pricePerHour: null,
      minPeople: 10,
      maxPeople: 100,
      minHours: 2,
      maxHours: 8,
      serviceFeePercentage: 15.00,
    }
  },
  {
    name: 'per-hour',
    settings: {
      pricingModel: 'per-hour',
      pricePerHour: 150.00,
      basePrice: 0,
      pricePerPerson: null,
      minPeople: 15,
      maxPeople: 80,
      minHours: 3,
      maxHours: 10,
      serviceFeePercentage: 12.00,
    }
  },
  {
    name: 'per-event',
    settings: {
      pricingModel: 'per-event',
      basePrice: 800.00,
      pricePerPerson: null,
      pricePerHour: null,
      minPeople: 20,
      maxPeople: 150,
      minHours: 4,
      maxHours: 12,
      serviceFeePercentage: 18.00,
    }
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
 * Get random pricing model
 */
function getRandomPricingModel() {
  const randomIndex = Math.floor(Math.random() * PRICING_MODELS.length);
  return PRICING_MODELS[randomIndex];
}

async function addOnSitePresence() {
  try {
    const limit = parseInt(process.argv[2]) || 5; // Default to 5 restaurants

    console.log(`📋 Configuration:`);
    console.log(`   Restaurants to configure: ${limit}`);
    console.log(`   Pricing models available: ${PRICING_MODELS.map(m => m.name).join(', ')}`);
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
        // Check if on-site presence already enabled
        const [existingSettings] = await sequelize.query(
          `SELECT * FROM RestaurantOrderTypeSettings
           WHERE restaurantId = ? AND orderType = 'on-site-presence'`,
          { replacements: [restaurant.id] }
        );

        if (existingSettings && existingSettings.length > 0 && existingSettings[0].isEnabled) {
          console.log(`   ⏭️  On-site presence already enabled - skipping`);
          skipCount++;
          continue;
        }

        // Get random pricing model
        const pricingConfig = getRandomPricingModel();
        console.log(`   📊 Pricing Model: ${pricingConfig.name}`);

        // Delete existing settings if present (to update)
        await sequelize.query(
          `DELETE FROM RestaurantOrderTypeSettings
           WHERE restaurantId = ? AND orderType = 'on-site-presence'`,
          { replacements: [restaurant.id] }
        );

        // Insert on-site presence settings
        await sequelize.query(
          `INSERT INTO RestaurantOrderTypeSettings
           (restaurantId, orderType, isEnabled, pricingModel, basePrice, pricePerPerson,
            pricePerHour, minPeople, maxPeople, minHours, maxHours, serviceFeePercentage, createdAt, updatedAt)
           VALUES (?, 'on-site-presence', 1, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
          {
            replacements: [
              restaurant.id,
              pricingConfig.settings.pricingModel,
              pricingConfig.settings.basePrice,
              pricingConfig.settings.pricePerPerson,
              pricingConfig.settings.pricePerHour,
              pricingConfig.settings.minPeople,
              pricingConfig.settings.maxPeople,
              pricingConfig.settings.minHours,
              pricingConfig.settings.maxHours,
              pricingConfig.settings.serviceFeePercentage,
            ]
          }
        );

        console.log(`   ✅ On-site presence enabled`);
        console.log(`      - Min/Max People: ${pricingConfig.settings.minPeople}-${pricingConfig.settings.maxPeople}`);
        console.log(`      - Min/Max Hours: ${pricingConfig.settings.minHours}-${pricingConfig.settings.maxHours}`);
        console.log(`      - Service Fee: ${pricingConfig.settings.serviceFeePercentage}%`);

        if (pricingConfig.settings.pricePerPerson) {
          console.log(`      - Price per person: $${pricingConfig.settings.pricePerPerson}`);
        }
        if (pricingConfig.settings.pricePerHour) {
          console.log(`      - Price per hour: $${pricingConfig.settings.pricePerHour}`);
        }
        if (pricingConfig.settings.basePrice > 0) {
          console.log(`      - Base price (flat): $${pricingConfig.settings.basePrice}`);
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
        console.log(`\n   🎉 Successfully configured restaurant!`);

      } catch (error) {
        console.error(`   ❌ Error configuring restaurant: ${error.message}`);
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
      console.log(`🎉 On-site presence feature successfully added to ${successCount} restaurant(s)!`);
      console.log(``);
      console.log(`💡 You can now:`);
      console.log(`   - Create on-site presence orders for these restaurants`);
      console.log(`   - Test the unavailable dates blocking functionality`);
      console.log(`   - Use different pricing models (per-person, per-hour, per-event)`);
    }

    await sequelize.close();
    process.exit(0);

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error);
    process.exit(1);
  }
}

addOnSitePresence();
