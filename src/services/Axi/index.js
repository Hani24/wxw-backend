// const logger = require('mii-logger.js');
const axios = require('axios');
const http = require('http');
const https = require('https');

class Axi{

  constructor( { base='' }={} ){
    this.base = (base || '');
    this.headers = { };
  }

  addDefaultHeader( key, value ){ this.headers[ key ] = value; }
  setDefaultHeader( key, value ){ this.addDefaultHeader( key, value ); }
  setDefaultHeaders( headers ){ this.headers = headers; }
  setBase( base ){ this.base = base; }
  cleanHeaders(){ this.headers = {}; }

  async get( path, params={}, headers={}, debug=false ){ return this.exec('GET', path, params, headers, debug); }
  async post( path, params={}, headers={}, debug=false ){ return this.exec('POST', path, params, headers, debug); }
  async put( path, params={}, headers={}, debug=false ){ return this.exec('PUT', path, params, headers, debug); }
  async head( path, params={}, headers={}, debug=false ){ return this.exec('HEAD', path, params, headers, debug); }
  async delete( path, params={}, headers={}, debug=false ){ return this.exec('DELETE', path, params, headers, debug); }
  async option( path, params={}, headers={}, debug=false ){ return this.exec('OPTION', path, params, headers, debug); }

  paramsToGetParams(params){

    const get = [];

    for( const key of Object.keys(params) ){
      get.push(`${key}=${params[key]}`);
    }

    return get.length > 0 ? `?${get.join('&')}` : '';

  }

  // ------------------------------------------------
  // exec
  async exec( method, path, params={}, headers={}, debug=false ){

    // return console.json({ method, path, params, headers });

    return new Promise( async(resolve, reject)=>{
      try{

        // console.json({ ...this.headers, ...headers });

        const b_url = (this.base + path).replace('://','[SERT-PROTO]').replace(/\/\//g,'/').replace('[SERT-PROTO]','://').trim();
        const url = `${b_url}${( method.toLowerCase() !== 'post' ? this.paramsToGetParams(params) : '' )}`;

        const allHeaders = { ...this.headers, ...headers };

        if( debug )
          console.json({url, method, headers: allHeaders, data: params, });

        // return console.json({ url, method, allHeaders, params });

        const config = {
          url,
          method,
          headers: allHeaders,
          data: method === 'GET' ? null : params,
          body: params,
          responseType: 'json',
          httpAgent: new http.Agent({ rejectUnauthorized: false }),
          httpsAgent: new https.Agent({ rejectUnauthorized: false }),
        };

        // if( method.toLowerCase() !== 'get' ){
        //   config.body = params;
        // }

        axios( config )
          .then((res)=>{
            if( (+res.status) >= 300 ){
              console.warn(`#axi:get: [${ res.statusText }]`);
              return resolve({ success:false, message: res.statusText, data: res.data, path });
            }
            res.data.path = path;
            resolve({ success: true, message: 'ok', data: res.data, path });
          })
          .catch((err)=>{
            console.error(err);
            if( err.response && err.response.data){
              // Server JSON: NON: 200          
              // err.response.data.path = path;
              resolve({ success: true, message: 'error', data: err.response.data, path });
            }else{
              // Server: [Unreachable, Error, Network-Error, etc...]
              resolve({ success: false, message: err.message, data: null, path });
            }
          })

      }catch(e){
        // resolve( this._extractError( method, e, {method, path, params, headers} ) );
        resolve({ success:false, message: e.message, data: null, path });
      }

    });
  }

  _extractError( httpMethod, exc, reqParams, debug=true ){

    if( exc.response && exc.response.status ){
      const resp = exc.response;
      let message = resp.statusText+' '
        +( resp.data.error ? ( resp.data.error.message || JSON.stringify(resp.data.error)) : resp.data.error);

      if( debug ){
        console.warn(` #${ httpMethod }: [${ this.base +reqParams.path }] ${ message }`);
        // console.json({ reqParams });
      }

      return({ success: false, code: resp.status, message, data:null});

    }else{
      if( debug ){
        console.log( exc );
        console.warn(` #${ httpMethod }: [${ this.base +reqParams.path }] ${ exc.message }`);        
        // console.json({ reqParams });
      }
      return({ success: false, code: 500, message: exc.message, data:null});
    }

  }

}

module.exports = (App, params={})=>{
  return new Axi( params );
}


// [03:24:46][L] : {
// [03:24:46][L] :   "sms.clicksend.send": {
// [03:24:46][L] :     "success": false,
// [03:24:46][L] :     "message": "break",
// [03:24:46][L] :     "data": {
// [03:24:46][L] :       "total_price": 0.0811,
// [03:24:46][L] :       "total_count": 1,
// [03:24:46][L] :       "queued_count": 1,
// [03:24:46][L] :       "messages": [
// [03:24:46][L] :         {
// [03:24:46][L] :           "direction": "out",
// [03:24:46][L] :           "date": 1633397086,
// [03:24:46][L] :           "to": "+32498403994",
// [03:24:46][L] :           "body": "Morris Armstrong - code 1234",
// [03:24:46][L] :           "from": "+32460205620",
// [03:24:46][L] :           "schedule": 1633397086,
// [03:24:46][L] :           "message_id": "17613260-3851-454B-BC2A-16372BCE852E",
// [03:24:46][L] :           "message_parts": 1,
// [03:24:46][L] :           "message_price": "0.0811",
// [03:24:46][L] :           "from_email": null,
// [03:24:46][L] :           "list_id": null,
// [03:24:46][L] :           "custom_string": "",
// [03:24:46][L] :           "contact_id": null,
// [03:24:46][L] :           "user_id": 274284,
// [03:24:46][L] :           "subaccount_id": 311325,
// [03:24:46][L] :           "country": "BE",
// [03:24:46][L] :           "carrier": "Orange",
// [03:24:46][L] :           "status": "SUCCESS"
// [03:24:46][L] :         }
// [03:24:46][L] :       ],
// [03:24:46][L] :       "_currency": {
// [03:24:46][L] :         "currency_name_short": "EUR",
// [03:24:46][L] :         "currency_prefix_d": "€",
// [03:24:46][L] :         "currency_prefix_c": "c",
// [03:24:46][L] :         "currency_name_long": "Euros"
// [03:24:46][L] :       }
// [03:24:46][L] :     }
// [03:24:46][L] :   }
// [03:24:46][L] : }
