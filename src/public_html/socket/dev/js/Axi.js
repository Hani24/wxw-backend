class Axi{

  constructor( { base='' }={} ){
    this.base = (base || '');
    this.headers = {
      'content-type': 'application/json',
      'authorization': null
    };

    this._init();

  }

  async _init(){
    if( window.MEDB.get('token') ){
      this.addDefaultHeader('authorization', window.MEDB.get('token') );
    }
  }

  async get( path, params={}, headers={}, debug=false ){ return this._exec('GET', path, params, headers, debug); }
  async post( path, params={}, headers={}, debug=false ){ return this._exec('POST', path, params, headers, debug); }
  async put( path, params={}, headers={}, debug=false ){ return this._exec('PUT', path, params, headers, debug); }
  async head( path, params={}, headers={}, debug=false ){ return this._exec('HEAD', path, params, headers, debug); }
  async delete( path, params={}, headers={}, debug=false ){ return this._exec('DELETE', path, params, headers, debug); }
  async option( path, params={}, headers={}, debug=false ){ return this._exec('OPTION', path, params, headers, debug); }

  addDefaultHeader( key, value ){ this.headers[ key ] = value; }
  setBase( base ){ this.base = base; }
  cleanHeaders(){ this.headers = {}; }

  paramsToGetParams(params){
    const get = Object.keys(params).map((key)=>`${key}=${params[key]}`);
    return get.length > 0 ? `?${get.join('&')}` : '';
  }

  async _exec( method, path, params={}, headers={}, debug=false ){

    return new Promise( async(resolve, reject)=>{
      try{

        const b_url = (this.base + path).replace('://','[SERT-PROTO]').replace(/\/\//g,'/').replace('[SERT-PROTO]','://').trim();
        const url = `${b_url}${( method.toLowerCase() !== 'post' ? this.paramsToGetParams(params) : '' )}`;

        const allHeaders = { ...this.headers, ...headers };

        if( debug )
          console.json({url, method, headers: allHeaders, data: params, });

        const config = {
          url,
          method,
          headers: allHeaders,
          data: method === 'GET' ? null : params,
          body: params,
          responseType: 'json',
          // httpAgent: new http.Agent({ rejectUnauthorized: false }),
          // httpsAgent: new https.Agent({ rejectUnauthorized: false }),
        };

        axios( config )
          .then((res)=>{
            if( (+res.status) >= 300 ){
              console.warn(`#axi:get: [${ res.statusText }]`);
              return resolve({ success:false, message: res.statusText, data: res.data, path });
            }
            resolve({ success: true, message: 'ok', data: res.data, path });
          })
          .catch((err)=>{
            console.error(err);
            if( err.response && err.response.data){
              resolve({ success: true, message: 'error', data: err.response.data, path });
            }else{
              // Server: [Unreachable, Error, Network-Error, etc...]
              resolve({ success: false, message: err.message, data: null, path });
            }
          })

      }catch(e){
        resolve({ success:false, message: e.message, data: null, path });
      }

    });
  }

}
