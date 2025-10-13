const http = require('http');
const https = require('https');
const axios = require('axios');

module.exports = _Base = class _Base{

  constructor(App, params={}){

    this.App = App;
    this.params = params;
    this.pushThrottleDelay = App.isPosNumber( +params.pushThrottleDelay ) ? params.pushThrottleDelay : 100;

    // this.base = params.base;
    // this.pushPath = params.pushPath;

    this.headers = {
      'Accept': 'application/json',
      'Accept-encoding': 'gzip, deflate',
      'Content-Type': 'application/json',
    };

    this._post = this._post.bind(this);

  }

  getPushDelay(){
    return this.pushThrottleDelay;
  }

  async _post( path, data={}, headers={} ){

    return new Promise(async(resolve)=>{
      try{
        const url = this.base + path;
        console.log(`push notification migration: final url: ${url} final data: ${JSON.stringify(data)}`);

        const result = await axios({
          url,
          method: 'post',
          headers: { ...this.headers, ...headers },
          data: data,
          responseType: 'json',
          httpAgent: new http.Agent({ rejectUnauthorized: false }),
          httpsAgent: new https.Agent({ rejectUnauthorized: false }),
        });
console.log(`push notification migration result status: ${result.status}, statustext: ${result.statusText}, data: ${JSON.stringify(result.data)}`);
	if( (+result.status) >= 300 ){
          resolve({
            success: false,
            message: `${+result.status}: ${result.statusText}`, 
            data: result.data || null, 
            error: result.error
          });
          return;
        }

        resolve({success: true, message: 'OK', data: result.data });
      }catch(e){
        resolve({success: false, message: e.message, data: null});
      }
    });
  }

  async send(data={}){}

}
