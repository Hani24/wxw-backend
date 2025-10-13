const virtualConsoleColors = [
  { regExp: new RegExp(/\033\[(00|01);30m/, 'g'), replace: '<span class="gray">' },
  { regExp: new RegExp(/\033\[(00|01);31m/, 'g'), replace: '<span class="red">' },
  { regExp: new RegExp(/\033\[(00|01);32m/, 'g'), replace: '<span class="green">' },
  { regExp: new RegExp(/\033\[(00|01);33m/, 'g'), replace: '<span class="yellow">' },
  { regExp: new RegExp(/\033\[(00|01);34m/, 'g'), replace: '<span class="blue">' },
  { regExp: new RegExp(/\033\[(00|01);35m/, 'g'), replace: '<span class="purple">' },
  { regExp: new RegExp(/\033\[(00|01);36m/, 'g'), replace: '<span class="blue2">' },
  { regExp: new RegExp(/\033\[(00|01);37m/, 'g'), replace: '<span class="white">' },
  { regExp: new RegExp(/\033\[0m/, 'g'), replace: '</span>' },
];


module.exports = {
  colors: virtualConsoleColors,
};

