require('mii-logger.js');

const NODE_ENV = process.env.NODE_ENV || 'prod';
const IS_PROD = NODE_ENV === 'prod' || NODE_ENV === 'production'; // || 'stage';
const config = require(`${__dirname}/common/config.js`);

console.line(``);
console.log(` #env: [${ NODE_ENV }]`);
for( const env_key of Object.keys( config ) ){
  process.env[ env_key ] = config[ env_key ];
}

process.env.NODE_ENV = NODE_ENV;
process.env.IS_PROD = IS_PROD ? '1' : '';
// process.env.config = config;

