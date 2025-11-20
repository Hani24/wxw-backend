/**
 * Script to populate totalRSVPs field in RestaurantPosts table
 * This counts all RSVPs with status 'interested' or 'going' for each event post
 * Usage: node scripts/populate-total-rsvps.js
 */

const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const mysql = require('mysql2/promise');

async function populateTotalRSVPs() {
  let connection;

  try {
    console.log('\n🚀 Connecting to database...\n');

    connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
    });

    console.log('✅ Connected to database\n');
    console.log('=== Starting totalRSVPs Population ===\n');

    // Get all event posts
    const [eventPosts] = await connection.execute(
      `SELECT id, title FROM RestaurantPosts WHERE postType = 'event'`
    );

    console.log(`Found ${eventPosts.length} event posts to process\n`);

    let updatedCount = 0;

    for (const post of eventPosts) {
      // Count RSVPs with status 'interested' or 'going'
      const [countResult] = await connection.execute(
        `SELECT COUNT(*) as count FROM EventRSVPs
         WHERE postId = ? AND status IN ('interested', 'going')`,
        [post.id]
      );

      const count = countResult[0].count;

      // Update the post
      await connection.execute(
        `UPDATE RestaurantPosts SET totalRSVPs = ? WHERE id = ?`,
        [count, post.id]
      );

      updatedCount++;
      console.log(`[${updatedCount}/${eventPosts.length}] Post ID ${post.id} "${post.title}": ${count} RSVPs`);
    }

    console.log(`\n=== ✅ Completed! Updated ${updatedCount} event posts ===\n`);

    await connection.end();
    process.exit(0);

  } catch (error) {
    console.error('❌ Error populating totalRSVPs:', error);
    if (connection) {
      await connection.end();
    }
    process.exit(1);
  }
}

// Run the script
populateTotalRSVPs();
