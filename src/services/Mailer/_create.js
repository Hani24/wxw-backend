const logger = require('mii-logger.js');


const list = console.readFileSync('./new.list').split('\n').map((item)=>{ return item.trim(); });

const clean = {};

for( const item of list ){
  if( item.replace(/^mail2(.*)$/, '') !== item ) continue;
  const email = (item.split('.')[0]).toLowerCase().trim();
  clean[ email ] = 1;
}

console.log({ found: Object.keys(clean).length })

console.jsonToFile('./clean.json', clean, true, 2, false);




























