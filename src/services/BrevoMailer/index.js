const BrevoMailer = require('./BrevoMailer');

module.exports = (App, params={})=>{
  return new BrevoMailer(App, params);
}
