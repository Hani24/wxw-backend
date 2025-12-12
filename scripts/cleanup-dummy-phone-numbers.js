/**
 * Script to clean up dummy phone numbers from the Users table
 * This will set phone to NULL for users who have phone values like:
 * - "EMAIL_xxxxx" (email/Google authenticated users)
 * - "guest_xxxxx" (guest users)
 *
 * Usage: node scripts/cleanup-dummy-phone-numbers.js
 */

const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

(async () => {
  let conn;
  try {
    console.log('Starting cleanup of dummy phone numbers...\n');

    // Create database connection
    conn = await mysql.createConnection({
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
    });

    // Find all users with dummy phone numbers (starting with EMAIL_ or guest_)
    const [usersWithDummyPhone] = await conn.execute(
      `SELECT id, email, phone, firstName, lastName, isGuest FROM Users WHERE phone LIKE 'EMAIL_%' OR phone LIKE 'guest_%'`
    );

    console.log(`Found ${usersWithDummyPhone.length} users with dummy phone numbers.\n`);

    if (usersWithDummyPhone.length === 0) {
      console.log('No cleanup needed. Exiting...');
      await conn.end();
      process.exit(0);
    }

    // Separate by type for better reporting
    const emailUsers = usersWithDummyPhone.filter(u => u.phone.startsWith('EMAIL_'));
    const guestUsers = usersWithDummyPhone.filter(u => u.phone.startsWith('guest_'));

    console.log(`Email/Google users: ${emailUsers.length}`);
    console.log(`Guest users: ${guestUsers.length}\n`);

    // Display the users that will be updated
    console.log('Users to be updated:');
    usersWithDummyPhone.forEach((user, index) => {
      const userType = user.isGuest ? 'Guest' : 'Email/Google';
      console.log(`${index + 1}. [${userType}] ID: ${user.id}, Email: ${user.email || 'N/A'}, Phone: ${user.phone}, Name: ${user.firstName} ${user.lastName}`);
    });

    console.log('\n⚠️  This will set the phone field to NULL for these users.');
    console.log('Updating...\n');

    // Update all users with dummy phone numbers
    const [result] = await conn.execute(
      `UPDATE Users SET phone = NULL WHERE phone LIKE 'EMAIL_%' OR phone LIKE 'guest_%'`
    );

    console.log(`✅ Successfully updated ${result.affectedRows} users.`);
    console.log('Dummy phone numbers have been removed.\n');

    await conn.end();
    process.exit(0);

  } catch (error) {
    console.error('Error during cleanup:', error);
    if (conn) await conn.end();
    process.exit(1);
  }
})();
