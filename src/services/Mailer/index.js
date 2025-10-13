
// const templates = require('./templates');
const Mailer = require('./Mailer');

module.exports = (App, params={})=>{
  return new Mailer(App, params);
}
