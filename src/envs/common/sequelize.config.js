const logger = require('mii-logger.js');

const NODE_ENV = process.env.NODE_ENV;
const DB_NAME = process.env.DB_NAME;
const DB_PROTOCOL = process.env.DB_PROTOCOL;
const DB_HOST = process.env.DB_HOST;
const DB_PORT = process.env.DB_PORT;
const DB_USER = process.env.DB_USER;
const DB_PASSWORD = process.env.DB_PASSWORD;
const DB_DIALECT = process.env.DB_DIALECT;
const DB_TIMEZONE = process.env.DB_TIMEZONE;
const DB_COLLATE = process.env.DB_COLLATE; // 'utf8_general_ci',
const DB_CHARSET = process.env.DB_CHARSET; // 'utf8',
const IS_PROD = process.env.IS_PROD;

// NODE_ENV=dev npx sequelize db:migrate
// ||
// npx sequelize db:migrate --env dev

const config = {
  username: DB_USER, 
  password: DB_PASSWORD, 
  database: DB_NAME, 
  host: DB_HOST, 
  port: DB_PORT, 
  dialect: DB_DIALECT, 
  timezone: DB_TIMEZONE, // if ( warning: please use IANA standard timezone format ('Etc/GMT0') )
  dialectOptions: {
    dialect: DB_DIALECT, 
    useUTC: false, // for reading from database
    timezone: DB_TIMEZONE, // timezone: 'Etc/GMT-2',
    collate: DB_COLLATE, // 'utf8_general_ci',
    charset: DB_CHARSET, // 'utf8',
  },
};

module.exports = {
  meta: {
    NODE_ENV,
  },
  dev: config,
  rem: config,
  stage: config,
  prod: config,
  test: config,
};
