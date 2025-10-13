const logger = require('mii-logger.js');
const FormData = require('form-data');
const Axi = require('../../Axi');

const CLICKSEND_API_PROTOCOL = process.env.CLICKSEND_API_PROTOCOL || 'n/a';
const CLICKSEND_API_BASE = process.env.CLICKSEND_API_BASE || 'n/a';
const CLICKSEND_API_VERSION = process.env.CLICKSEND_API_VERSION || 'n/a';
const CLICKSEND_API_KEY = process.env.CLICKSEND_API_KEY || 'n/a';
const CLICKSEND_API_ACCOUNT = process.env.CLICKSEND_API_ACCOUNT || 'n/a';

class Clicksend {

  constructor( App, name, params={} ){
    this.App = App;
    this.name = name;
    this.params = params;
    this.api = Axi({},{});
    this._defaultGetParams = {};
    this._authorization = null;
    this._init();
  }

  _init(){
    this._authorization = Buffer.from(`${CLICKSEND_API_ACCOUNT}:${CLICKSEND_API_KEY}`).toString('base64');
    this.api.setBase(CLICKSEND_API_BASE);
    // this.api.addDefaultHeader('Content-type','application/x-www-form-urlencoded');
    this._defaultGetParams = {};
  }

  async getBalance(){
    return await this._call('user', 'getownbalance');
    // {"code":0,"data":{"balance":"50.0916","currency":"UAH"},"message":""}
  }

  async send( recipient='', text='' ){

    recipient = this.App.tools.cleanPhone( recipient || '' );

    if( !this.App.tools.isValidPhone(recipient) )
      return {success: false, message: 'Phone number [recipient] is not valid', data: {}};

    text = this.App.isString(text) ? text.trim().substr(0, 256) : false;
    if( !text || !text.length ){
      return { success: false, message: 'Data [text] is not valid', data: {} };
    }

    const data_t = {
      messages: [
        { to: recipient, body: text, source:'sdk' }
      ]
    };

    const sendRes = await this._call('/sms/send', data_t );

    if( !sendRes.success ){
      console.json({sendRes});
      return sendRes;
    }

    const json_t = sendRes.data;

    return {success: true, message: 'OK', data: {
      totalPrice: json_t.data.total_price, 
      totalCount: json_t.data.total_count, 
      queuedCount: json_t.data.queued_count, 
      messages: json_t.data.messages.map((mMessage)=>{
        return {
          to: mMessage.to, // "+32498403994",
          body: mMessage.body, // "Morris Armstrong - code 1234",
          from: mMessage.from, // "+32460205620",
          // schedule: mMessage.schedule, // 1633397293,
          message_id: mMessage.message_id, // "CD54537D-E295-4FA3-9DFF-D6E597F567CA",
          country: mMessage.country, // "BE",
          carrier: mMessage.carrier, // "Orange",
          status: mMessage.status,
          success: mMessage.status === 'SUCCESS',
          message_price: (+mMessage.message_price),
        }
      })
    }};

    console.debug(` #sms:${this.name}: send: recipient: [${recipient}], success: [${sendRes.success}], message: [${text}]`);
    return sendRes;
  }

  // ------------------------------------------------------------------
  async _call( route='', data=false){
    const self = this;

    return new Promise(async(resolve)=>{

      try{

        const path = route;
        const getParams = self.api.paramsToGetParams(self._defaultGetParams);
        const url = `${path}${getParams}`;

        // const form = new FormData();
        // for( const mKey of Object.keys(data) ){
        //   if( self.App.isString(data[ mKey ]) )
        //     form.append(mKey, data[ mKey ]);
        // }

        const headers = {
          // 'Content-Type': form.getHeaders()['content-type'],
          'Content-Type': 'application/json',
          Authorization: `Basic ${this._authorization}`,
        };

        // console.json({path, getParams, headers, url, data});

        // return resolve({success: false, message: 'break', data: {
        //   path, getParams, headers, url, data
        // } });

        if( self.App.isObject(data) && Object.keys(data).length >= 1 ){
          const sendRes = await self.api.post( url, data, headers );
          return resolve( sendRes );
        }else{
          const sendRes = await self.api.get( url, {}, headers );
          return resolve( sendRes );
        }

      }catch(e){
        console.error(`#${self.name}: [${route}]: ${e.message}`);
        return resolve({ success: false, message: `[error]: Request could not be processed`, data: {} });
      }

    });
  }

}

module.exports = (App, name, params={})=>{

  return new Clicksend(App, name, params);

}
