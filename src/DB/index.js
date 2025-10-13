const logger = require('mii-logger.js');
const { Sequelize, Transaction, Op, literal, QueryTypes, TableHints } = require('sequelize');
const { fn, col, where } = Sequelize;

// DataTypes.DATE.prototype._stringify = function _stringify(date, options) {
//   date = this._applyTimezone(date, options)
//   return date.format("YYYY-MM-DD HH:mm:ss.SSS")
// }

// Sequelize.Transaction.ISOLATION_LEVELS.SERIALIZABLE

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

const dataLimits = require('./dataLimits.js');
const txOptions = {
  autocommit: false,
  isolationLevel: Transaction.ISOLATION_LEVELS.REPEATABLE_READ,
  type: Transaction.TYPES.EXCLUSIVE, // sqlite only ???
};

// Transaction.TYPES
// {"READ_UNCOMMITTED": string, "READ_COMMITTED": string, "REPEATABLE_READ": string, "SERIALIZABLE": string}

// ISOLATION_LEVELS: 
// REPEATABLE_READ, READ_COMMITTED, READ_UNCOMMITTED,

// NODE_ENV=dev npx sequelize model:generate --name Test --attributes firstName:string,lastName:string,email:string
// NODE_ENV=dev npx sequelize db:migrate

const initSequelize = (App)=>{

  const sequelize = new Sequelize(DB_NAME, DB_USER, DB_PASSWORD, {
    host: DB_HOST,
    port: DB_PORT,
    // dialect: DB_DIALECT,
    dialect: DB_DIALECT,
    logging: IS_PROD ? false : false,
    // logging: (data)=>{ console.log(data); },
    pool: {
      maxConnections: 20,
      maxIdleTime: 30000
    },
    define: {
      underscored: false,
      freezeTableName: false,
      charset: DB_CHARSET, // 'utf8',
      dialectOptions: {
        collate: DB_COLLATE, // 'utf8_general_ci',
      },
      timestamps: true
    },

    // transaction pool config ???
    // ISSUE: https://github.com/mariadb-corporation/mariadb-connector-nodejs/issues/48
    // dialectOptions: {
    //   useUTC: false, // for reading from database
    //   timezone: DB_TIMEZONE, // timezone: 'Etc/GMT-2',
    //   collate: DB_COLLATE, // 'utf8_general_ci',
    //   charset: DB_CHARSET, // 'utf8',
    //   // dateStrings: true,
    //   typeCast(field, next) {
    //     // for reading from database
    //     if (field.type === 'DATETIME') {
    //       const datetime_t = field.string();
    //       return App.DT.isValidDatetime(datetime_t)
    //         ? App.DT.moment( datetime_t ).format( App.getDateFormat(false) )
    //         : null;;
    //     }
    //     return next();
    //   },
    // },
    // timezone: DB_TIMEZONE, // 'Etc/GMT-2' // for writing to database
    // timezone: 'Etc/GMT+8',
    // timezone: 'Etc/GMT-8',
    // timezone: '+02:00',
  });

  return sequelize;

}

module.exports = async(App, params={})=>{

  const sequelize = initSequelize( App );
  const models = require('./models');

  const getTxOptions = ( params={} )=>{
    return console.deepClone({
      ...txOptions,
      ...( App.isObject(params) ? params : {} ),
    });
  };

  const createUnmanagedTx = async()=>{
    const tx = await sequelize.transaction( getTxOptions() );
    return tx;
  };

  return {
    models: await models(App, params, sequelize),
    query: sequelize.query,
    sequelize,
    Op,
    fn,
    Transaction,
    where,
    col,
    literal,
    QueryTypes,
    TableHints,
    dataLimits,
    txOptions,
    transaction: sequelize.transaction,
    getTxOptions,
    createUnmanagedTx,
  };

}

// TINYTEXT: 255 characters - 255 B
// The TINYTEXT data object is the smallest of the TEXT family and is built to efficiently store short information strings. This type can store up to 255 bytes (expressed as 2^8 -1) or 255 characters and requires a 1 byte overhead. This object can be used to store things like short summaries, URL links, and other shorter objects. TINYTEXT shines over VARCHAR when storing data that’s under 255 characters with an inconsistent length and no need to be used for sorting criteria.

// TEXT: 65,535 characters - 64 KB
// The standard TEXT data object is sufficiently capable of handling typical long-form text content. TEXT data objects top out at 64 KB (expressed as 2^16 -1) or 65,535 characters and requires a 2 byte overhead. It is sufficiently large enough to hold text for something like an article, but would not be sufficient for holding the text of an entire book.

// MEDIUMTEXT: 16,777,215 - 16 MB
// The MEDIUMTEXT data object is useful for storing larger text strings like white papers, books, and code backup. These data objects can be as large as 16 MB (expressed as 2^24 -1) or 16,777,215 characters and require 3 bytes of overhead storage.
// LONGTEXT: 4,294,967,295 characters - 4 GB

// Type  Storage (Bytes)   Minimum Value Signed  Minimum Value Unsigned  Maximum Value Signed  Maximum Value Unsigned
// TINYINT       1         -128        0         127               255
// SMALLINT      2         -32768      0         32767             65535
// MEDIUMINT     3         -8388608    0         8388607           16777215
// INT           4         -2147483648 0         2147483647        4294967295 (2**(4*8)) == 4294967296
// BIGINT        8         -263        0         263-1             264-1
