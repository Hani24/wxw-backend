// require('mii-logger.js');
const fs = require('fs');

let data_t = fs.readFileSync(`${__dirname}/../out.log`,'utf-8');

const colors = [
  { regExp: new RegExp(/\033\[(00|01);30m/, 'g'), replace: '<span class="gray">' },
  { regExp: new RegExp(/\033\[(00|01);31m/, 'g'), replace: '<span class="red">' },
  { regExp: new RegExp(/\033\[(00|01);32m/, 'g'), replace: '<span class="green">' },
  { regExp: new RegExp(/\033\[(00|01);33m/, 'g'), replace: '<span class="blue">' },
  { regExp: new RegExp(/\033\[(00|01);34m/, 'g'), replace: '<span class="yellow">' },
  { regExp: new RegExp(/\033\[(00|01);35m/, 'g'), replace: '<span class="purple">' },
  { regExp: new RegExp(/\033\[(00|01);36m/, 'g'), replace: '<span class="blue2">' },
  { regExp: new RegExp(/\033\[(00|01);37m/, 'g'), replace: '<span class="white">' },
  { regExp: new RegExp(/\033\[0m/, 'g'), replace: '</span>' },
  // { regExp: new RegExp(/\033\[(00|01);30m/, 'g'), replace: '[gray]' },
  // { regExp: new RegExp(/\033\[(00|01);31m/, 'g'), replace: '[red]' },
  // { regExp: new RegExp(/\033\[(00|01);32m/, 'g'), replace: '[green]' },
  // { regExp: new RegExp(/\033\[(00|01);33m/, 'g'), replace: '[yellow]' },
  // { regExp: new RegExp(/\033\[(00|01);34m/, 'g'), replace: '[blue]' },
  // { regExp: new RegExp(/\033\[(00|01);35m/, 'g'), replace: '[purple]' },
  // { regExp: new RegExp(/\033\[(00|01);36m/, 'g'), replace: '[blue2]' },
  // { regExp: new RegExp(/\033\[(00|01);37m/, 'g'), replace: '[white]' },
  // { regExp: new RegExp(/\033\[0m/, 'g'), replace: '[]' },
];

for( const mColor of colors ){

  data_t = data_t
    // .replace(/(\x1b\[[0-9]{1,2};[0-9]{0,2}m)|(\x1b\[[0-9]{1,2}m)|(\x1b\[[0-9m;]{1,})*/g,'')
    .replace(mColor.regExp, mColor.replace )
    // .replace(/(\n)*/g,'');

}


console.log(data_t);
// console.log(data_t.match(_red));


















