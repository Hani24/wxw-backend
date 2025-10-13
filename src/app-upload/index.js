const config = require('./config');
const path = require('./path');

module.exports = (App, params={})=>{

  return {
    config: config( App, params ),
    path: path( App, params ),    
  };

}
