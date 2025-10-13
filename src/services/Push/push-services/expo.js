const _Base = require('../_Base');

const PUSH_EXPO_API_BASE = process.env.PUSH_EXPO_API_BASE;
const PUSH_EXPO_API_PUSH_PATH = process.env.PUSH_EXPO_API_PUSH_PATH;

module.exports = Expo = class Expo extends _Base{

  constructor(App, params={}){
    super(App, params);
    this.base = PUSH_EXPO_API_BASE;
    this.pushPath = PUSH_EXPO_API_PUSH_PATH;
  }

  async send(data={}){

    if( !data || !data.to ){
      return {success: false, msg: 'to:[push-token] is requred'};
    }

    const sendPushRes = await this._post( this.pushPath, data );

    return sendPushRes;
  }

}
