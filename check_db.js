const Sequelize = require('sequelize');
const path = require('path');

process.env.NODE_ENV = 'dev';
const envPath = path.join(__dirname, 'src/envs/dev/index.js');
const config = require(envPath);

const sequelize = new Sequelize(config.db.database, config.db.username, config.db.password, {
  host: config.db.host,
  dialect: 'mariadb',
  logging: false
});

async function check() {
  try {
    const [results] = await sequelize.query("SHOW COLUMNS FROM RestaurantPosts WHERE Field = 'postType'");
    console.log('Column definition:', JSON.stringify(results, null, 2));
    
    const [posts] = await sequelize.query("SELECT id, title, postType, eventDate FROM RestaurantPosts ORDER BY id DESC LIMIT 5");
    console.log('\nRecent posts:', JSON.stringify(posts, null, 2));
    
    await sequelize.close();
    process.exit(0);
  } catch(e) {
    console.error(e);
    process.exit(1);
  }
}

check();
