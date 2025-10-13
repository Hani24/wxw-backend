require('mii-logger.js');
require('dotenv').config();


const SERVER_MAX_POST_SIZE = '250mb';
const SERVER_COMPRESSION = true;
const SERVER_ALLOW_IP_ACCESS = false;

module.exports = {
  SERVER_MAX_POST_SIZE,
  SERVER_COMPRESSION,
  SERVER_ALLOW_IP_ACCESS,
};

