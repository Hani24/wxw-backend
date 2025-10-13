// npm i --save bluebird node-telegram-bot-api mii-logger.js
const logger = require('mii-logger.js');
// const fixPromise = require('./fix-promise');
const TelBot = require('node-telegram-bot-api');

module.exports = Bot = class Bot {

  constructor(params={}){
    this.params = params || {};
    this.name = params.name || 'App';
    this.app_root = params.app_root || __dirname;

    this.accessToken = params.accessToken || null;
    this.botParams = params.botParams || {};

    this.bot = null;
    this._event_subs = {};
    this._init();

  }

  async _init(){

    const self = this;

    try{

      self.bot = new TelBot(self.accessToken, self.botParams );

      // self.bot.on('message', (msg) => {
      //   console.json({'on:message': msg });
      // });

      // self.bot.on('inline_query', (cbQuery)=>{
      //   console.json({inline_query: { cbQuery }});
      // });

      // self.bot.on('telegram_callback', (cbQuery)=>{
      //   console.json({telegram_callback: { cbQuery }});
      // });

      // self.bot.on('chosen_inline_result', (cbQuery)=>{
      //   console.json({chosen_inline_result: { cbQuery }});
      // });

      // self.bot.on('polling_error', (error) => {
      //   console.error(`polling_error: ${error.code}: ${error.message}`);  // => 'EFATAL'
      // });

      // self.bot.on('error', (error) => {
      //   console.error(`error: ${error.code}: ${error.message}`);  // => 'EFATAL'
      // });

      // self.on('bot:error', async ({replay=false, type='', name='n/a', msg, e}={})=>{

      //   try{
      //     console.debug(` #${self.name}:on:[bot:error]: t:[${type}], name:[${name}] => ${e.message}`);
      //     // const resp = replay || 'Request could not be process';
      //     // const replRes = await self.ACC['send-markdown'](msg, resp);
      //     return true;
      //   }catch(_err){
      //     console.error(` #${self.name}:on:[bot:error]: ${_err.message}`);
      //     return false;
      //   }

      // });

      // Handle callback queries
      // self.bot.on('callback_query', async(cbQuery)=>{

      //   try{

      //     const msg = cbQuery.message;
      //     const reply_markup = msg.reply_markup;
      //     const inline_keyboard = reply_markup.inline_keyboard;
      //     const {text, callback_data} = msg.reply_markup.inline_keyboard[0][0];
      //     const json_t = JSON.parse(callback_data);
      //     console.json({callback_query: { text, json_t }});

      //     return true;
      //   }catch(e){
      //     console.error(` #${self.name}:on:[callback_query:error]: ${e.message}`);
      //     return false;
      //   }
      // });

      await console.sleep(1000);
      self.emit(`${this.name}-is-ready`, {});

      return true;
    }catch(e){
      console.warn(` #${this.name}:_init: ${e.message}`);
      console.log(e);
      return false;
    }

  }

  async onInfo( msg, params={} ){ return await this._send('info',msg,params); }
  async onWarning( msg, params={} ){ return await this._send('warning',msg,params); }
  async onError( msg, params={} ){ return await this._send('error',msg,params); }

  async _send( type, msg, params={} ){

    try{

      let message = `${type}\n`;
      message += `${msg}\n`;
      message += this.getHumanDatetime();
      const sendRes = await this.bot.sendMessage( this.params.group.id, message, {
        // parse_mode: 'MarkdownV2',
        ...params,
      });

      // let message = '`'+( type )+'`\n';
      // message += msg+'\n';
      // message += '`'+( this.getHumanDatetime() )+'`';
      // const sendRes = await this.bot.sendMessage( this.params.group.id, message, {
      //   parse_mode: 'MarkdownV2',
      //   ...params,
      // });

      return ( !!sendRes );

    }catch(e){
      console.error(` #${this.name}:on: send: [${type}]: ${e.message}`);
      return false;
    }

  }

  toDataType( type_t, data_t, args ){

    switch( type_t.toString().toLowerCase().trim() ){
      case 'string': return ( data_t.toString() );
      case 'number': return ( +data_t );
      case 'int': return ( ( (+data_t) || 0 ).toFixed(0) );
      case 'float': return ( ( (+data_t) || 0 ).toFixed( (+args) || 8 ) );
    }
    return data_t;
  }

  // [common]:[types]
  isString( value ){ return typeof value === 'string'; }
  isArray( value ){ return Array.isArray(value); }
  isNumber( value ){ return typeof value === 'number' && !this.isNaN( value ) && (Math.abs(value) !== Infinity); }
  isObject( value ){ return typeof value === 'object' && !this.isNull(value) && !this.isArray(value); }
  isNull( value ){ return typeof value === 'object' && value === null; }
  isNaN( value ){ return typeof value === 'number' && isNaN(value); }
  isUndefined( value ){ return typeof value === 'undefined'; }
  isBool( value ){ return typeof value === 'boolean'; }
  isBoolean( value ){ return this.isBool(value); }

  isPosNumber( value ){ return this.isNumber(value); /* && value >= 0 */ }
  isNegNumber( value ){ return this.isNumber(value) && value < 0; }
  isFunction( value ){ return typeof value === 'function'; }

  getISODate(){ return (new Date()).toISOString().split('.')[0]; }
  // getISODate(){ return this.DT.moment().format().split('+')[0]; }
  getServerTime(){ return this.getISODate(); }
  getHumanDate(){ return this.getISODate().split('T')[0]; }
  getHumanDatetime(){ return this.getISODate().replace('T',' '); }

  on(event, callback){
    try{

      if( !event || !this.isString(event)|| !this.isFunction(callback) )
        return false;

      if( !this.isArray(this._event_subs) )
        this._event_subs[ event ] = [];

      this._event_subs[ event ].push( callback );
      return true;

    }catch(e){
      console.error(` #${this.name}:on: event: [${event}]: ${e.message}`);
      return false;
    }

  }

  emit(event, data={}, params={}){
    try{

      if( !event || !this.isString(event) )
        return false;

      if( !this.isArray(this._event_subs[ event ]) )
        return false;

      for( const callback of this._event_subs[ event ] ){
        try{
          if( !this.isFunction(callback) ) continue;
          callback( data, params );
        }catch(e){
          console.warn(` #${this.name}:emit: [0]: [${event}]: ${e.message}`)
        }
      }

      return true;

    }catch(e){
      console.error(` #${this.name}:emit: [1]: event: [${event}]: ${e.message}`);
      return false;
    }

  }
}