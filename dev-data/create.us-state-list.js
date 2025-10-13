const logger = require('mii-logger.js');

const states = require(`${__dirname}/us-state.js`);
const cities = require(`${__dirname}/cities.js`);
const data = {};

for( const state of states ){
  if( !data.hasOwnProperty( state.name ) ){
    data[ state.name ] = {
      code: state.code,
      cities: cities
        .filter((mCity)=>mCity.state === state.name )
        .map((mCity)=>{ return { name: mCity.city } })
    }
  }
}

// console.json({data});
console.jsonToFile(`${__dirname}/import.json`, data);