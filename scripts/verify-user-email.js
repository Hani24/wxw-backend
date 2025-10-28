/**
 * Script to manually verify user email
 * Usage: node scripts/verify-user-email.js <email>
 * Example: node scripts/verify-user-email.js test@restaurant.com
 */

const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const email = process.argv[2];

if (!email) {
  console.error('❌ Error: Email is required');
  console.log('Usage: node scripts/verify-user-email.js <email>');
  console.log('Example: node scripts/verify-user-email.js test@restaurant.com');
  process.exit(1);
}

async function verifyEmail() {
  try {
    // Initialize your app/database connection
    const sequelize = require('../src/DB/sequelize');
    const { User } = sequelize.models;

    // Find the user
    const user = await User.findOne({
      where: { email }
    });

    if (!user) {
      console.error(`❌ User with email "${email}" not found`);
      process.exit(1);
    }

    console.log(`\n📧 User found:`);
    console.log(`   ID: ${user.id}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Role: ${user.role}`);
    console.log(`   Email Verified: ${user.isEmailVerified}`);

    if (user.isEmailVerified) {
      console.log('\n✅ Email is already verified!');
      process.exit(0);
    }

    // Update user
    await user.update({ isEmailVerified: true });

    console.log('\n✅ Email verification successful!');
    console.log(`   ${email} is now verified`);

    // Check if it's a restaurant user
    if (user.role === 'restaurant') {
      const { Restaurant } = sequelize.models;
      const restaurant = await Restaurant.findOne({
        where: { userId: user.id }
      });

      if (restaurant) {
        console.log(`\n🏪 Restaurant found:`);
        console.log(`   ID: ${restaurant.id}`);
        console.log(`   Name: ${restaurant.name}`);
        console.log(`   Verified: ${restaurant.isVerified}`);
        console.log(`   Restricted: ${restaurant.isRestricted}`);

        if (!restaurant.isVerified) {
          console.log('\n⚠️  Note: Restaurant account is NOT verified yet.');
          console.log('   Admin needs to verify the restaurant account.');
        }
      }
    }

    await sequelize.close();
    process.exit(0);

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

verifyEmail();
