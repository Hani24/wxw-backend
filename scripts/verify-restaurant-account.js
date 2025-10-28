/**
 * Script to manually verify restaurant account (both user email and restaurant)
 * Usage: node scripts/verify-restaurant-account.js <email>
 * Example: node scripts/verify-restaurant-account.js test@restaurant.com
 */

const path = require('path');

// Load environment variables from .env file
require('dotenv').config();

// Determine environment
const nodeEnv = process.env.NODE_ENV || 'dev';
console.log(`\n🔧 Environment: ${nodeEnv}\n`);

async function verifyRestaurant() {
  try {
    const email = process.argv[2];

    if (!email) {
      console.error('❌ Error: Email is required');
      console.log('Usage: node scripts/verify-restaurant-account.js <email>');
      console.log('Example: node scripts/verify-restaurant-account.js test@restaurant.com');
      process.exit(1);
    }

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
        dialect: config.dialect,
        logging: false
      }
    );

    // Test connection
    await sequelize.authenticate();
    console.log('✅ Database connected\n');

    // Find user
    const [users] = await sequelize.query(
      'SELECT * FROM Users WHERE email = ? AND role = "restaurant"',
      { replacements: [email] }
    );

    if (!users || users.length === 0) {
      console.error(`❌ Restaurant user with email "${email}" not found`);
      await sequelize.close();
      process.exit(1);
    }

    const user = users[0];
    console.log(`📧 User found:`);
    console.log(`   ID: ${user.id}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Role: ${user.role}`);
    console.log(`   Email Verified: ${user.isEmailVerified ? '✅ Yes' : '❌ No'}`);
    console.log(``);

    // Find restaurant
    const [restaurants] = await sequelize.query(
      'SELECT * FROM Restaurants WHERE userId = ?',
      { replacements: [user.id] }
    );

    if (!restaurants || restaurants.length === 0) {
      console.error(`❌ Restaurant not found for user ID ${user.id}`);
      await sequelize.close();
      process.exit(1);
    }

    const restaurant = restaurants[0];
    console.log(`🏪 Restaurant found:`);
    console.log(`   ID: ${restaurant.id}`);
    console.log(`   Name: ${restaurant.name || '(No name)'}`);
    console.log(`   Verified: ${restaurant.isVerified ? '✅ Yes' : '❌ No'}`);
    console.log(`   Restricted: ${restaurant.isRestricted ? '⚠️  Yes' : '✅ No'}`);
    console.log(`   Deleted: ${restaurant.isDeleted ? '⚠️  Yes' : '✅ No'}`);
    console.log(``);

    // Check what needs to be fixed
    const needsEmailVerification = !user.isEmailVerified;
    const needsRestaurantVerification = !restaurant.isVerified;
    const isRestricted = restaurant.isRestricted;

    if (!needsEmailVerification && !needsRestaurantVerification && !isRestricted) {
      console.log('✅ Account is already fully verified and not restricted!');
      await sequelize.close();
      process.exit(0);
    }

    console.log(`🔧 Fixing account...`);
    console.log(``);

    // Fix user email verification
    if (needsEmailVerification) {
      await sequelize.query(
        'UPDATE Users SET isEmailVerified = 1 WHERE id = ?',
        { replacements: [user.id] }
      );
      console.log(`   ✅ Email verified for ${email}`);
    }

    // Fix restaurant verification
    if (needsRestaurantVerification) {
      await sequelize.query(
        'UPDATE Restaurants SET isVerified = 1, verifiedAt = NOW() WHERE id = ?',
        { replacements: [restaurant.id] }
      );
      console.log(`   ✅ Restaurant verified (ID: ${restaurant.id})`);
    }

    // Remove restriction if present
    if (isRestricted) {
      await sequelize.query(
        'UPDATE Restaurants SET isRestricted = 0, restrictedAt = NULL WHERE id = ?',
        { replacements: [restaurant.id] }
      );
      console.log(`   ✅ Restriction removed from restaurant`);
    }

    console.log(``);
    console.log(`🎉 Restaurant account is now fully verified!`);
    console.log(`   You can now login with: ${email}`);

    await sequelize.close();
    process.exit(0);

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error);
    process.exit(1);
  }
}

verifyRestaurant();
