const logger = require('mii-logger.js');
const FormData = require('form-data');
const Axi = require('../../Axi');

// curl -X POST \
// -H "Content-type: application/x-www-form-urlencoded" \
// -d "recipient=+32498403994" \
// -d "text=Rating-Pro: verification code: [0123]" \
// "https://api.mobizon.ua/service/message/sendsmsmessage?output=json&api=v1&apiKey={apiKey}"
// -d "from=Rating-Pro" \

class Mobizon {

  constructor( App, name, params={} ){
    this.App = App;
    this.name = name;
    this.params = params;
    this.api = Axi({},{});
    this._defaultGetParams = {};
    this._init();
  }

  _init(){

    const MOBIZON_API_PROTOCOL = this.App.getEnv('MOBIZON_API_PROTOCOL');
    const MOBIZON_API_BASE = this.App.getEnv('MOBIZON_API_BASE');
    const MOBIZON_API_VERSION = this.App.getEnv('MOBIZON_API_VERSION');
    const MOBIZON_API_KEY = this.App.getEnv('MOBIZON_API_KEY');
    const MOBIZON_API_FROM = this.App.getEnv('MOBIZON_API_FROM');

    this.api.setBase(`${MOBIZON_API_PROTOCOL}://${MOBIZON_API_BASE}`);
    // this.api.addDefaultHeader('Content-type','application/x-www-form-urlencoded');
    this._defaultGetParams = {
      output: 'json',
      api: MOBIZON_API_VERSION,
      apiKey: MOBIZON_API_KEY, 
    };
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

    const sendRes = await this._call('message', 'sendsmsmessage', {recipient, text});
    // sendRes >> {"code":0,"data":{"campaignId":"48736783","messageId":"100197372","status":1},"message":""}
    console.debug(` #sms:${this.name}: send: recipient: [${recipient}], success: [${sendRes.success}], message: [${text}]`)
    return sendRes;
  }

  async getTaskStatus( id='' ){
    if( !id )
      return {success: false, message: 'task-queue [id] is not valid', data: {}};
    return await this._call('taskqueue', 'getstatus', {id});

  }

  async _call( apiModule='', apiMethod='', data=false){
    const self = this;

    return new Promise(async(resolve)=>{

      try{

        const path = `/service/${apiModule}/${apiMethod}`;
        const getParams = self.api.paramsToGetParams(self._defaultGetParams);

        if( self.App.isObject(data) && Object.keys(data).length >= 1 ){

          const form = new FormData();
          for( const mKey of Object.keys(data) ){
            if( self.App.isString(data[ mKey ]) )
              form.append(mKey, data[ mKey ]);
          }

          const headers = {'Content-Type': form.getHeaders()['content-type'] };
          const sendRes = await self.api.post( `${path}${getParams}`, form, headers );

          return resolve(self._getResponse(sendRes));

        }else{

          const sendRes = await self.api.get( `${path}${getParams}`, {}, {
            // 'Content-type': 'application/x-www-form-urlencoded'
          } );

          return resolve(self._getResponse(sendRes));

        }

      }catch(e){
        console.error(`#${self.name}: [${apiModule}/${apiMethod}]: ${e.message}`);
        return resolve({ success: false, message: `[error]: Request could not be processed`, data: {} });
      }

    });
  }

  _getResponse(response){

    try{

      // Status/Error cored => // https://mobizon.ua/help/api-docs/other#ApiCode
      // [0]   - ответ успешный.
      // [100] - ответ не является ошибкой и означает, что операция была отправлена в фоновое выполнение. В этом случае поле data содержит ID фоновой операции, прогресс и статус которой можно отследить при помощи запроса к API taskqueue/getstatus.
      // [*]   - Любой другой код ответа — ошибка во время выполнения операции. Просмотреть коды ошибок вы можете на этой странице документации.

      // codes: 
      //   4: wrong module
      //   5: wrong method

      // {
      //   "sendRes": {
      //     "code": 0,
      //     "data": {
      //       "balance": "50.0916",
      //       "currency": "UAH"
      //     },
      //     "message": "",
      //   }
      // }

      if( (+response.code) === 0 || (+response.code) === 100 )
        return { success: true, message: `success`, data: response.data }
      console.json({ [ this.name ]: {_getResponse: {response}} });
      return { success: false, message: response.message || 'no message', data: {} };

    }catch(e){
      console.error(`#${this.name}: _getResponse: ${e.message}`);
      return resolve({ success: false, message: `[error]: Could not create response`, data: {} });
    }
  }

}

module.exports = (App, name, params={})=>{

  return new Mobizon(App, name, params);

}
