const Bot = require('./Bot');

const TELEGRAM_BOT_ACCESS_TOKEN = process.env.TELEGRAM_BOT_ACCESS_TOKEN || null;
const TELEGRAM_BOT_TARGET_GROUP_ID = process.env.TELEGRAM_BOT_TARGET_GROUP_ID || null;


module.exports = async(App, params={})=>{

  const mBot = new Bot({
    name: 'DevFatalServerInfoBot',
    accessToken: TELEGRAM_BOT_ACCESS_TOKEN,
    group: {
      // name: '@DevFatalServerInfoGroup',
      id: TELEGRAM_BOT_TARGET_GROUP_ID,
    },
    botParams: {
      polling: true,
    },
  });

  return mBot;

};
