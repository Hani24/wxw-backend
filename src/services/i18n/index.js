const logger = require('mii-logger.js');

class I18N{

  constructor( App, params={} ){
    this.App = App;
    this.params = params;

    this.default_lang = params.defaultLang || 'en';
    this.langs = {};
    this._init();

  }

  async _init(){

    const langsList = console.listDir(`${this.App.services_root}/i18n/langs`);
    for( const langCode of langsList ){
      this.langs[ langCode ] = require(`${this.App.services_root}/i18n/langs/${langCode}`);
    }
  }

  t( data, lang='en', joinWith='' ){

    let res = [];

    if( Array.isArray( data ) ){
      for( const key of data )
        res.push( this._trans( key, lang ) );
    }else{
      res.push( this._trans( data, lang ) );
    }

    return res.join( joinWith ).trim();
  }

  _trans( key, lang='en' ){
    lang = this.langs.hasOwnProperty( lang ) ? lang : this.default_lang;
    const res = this.langs[ lang ].hasOwnProperty( key )
      ? this.langs[ lang ][ key ]
      : this.langs[ this.default_lang ][ key ] || key; // key as backup

    return `${(''+res).trim()} `; // +(' ')
  }

}

module.exports = (App, params)=>{
  return new I18N(App, params);
}
