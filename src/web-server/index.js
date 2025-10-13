const http = require('http');
const https = require('https');
const http2 = require('http2');
const { createSecureServer } = require("http2");
const fs = require('fs');

module.exports = ( App ) => {

  try{

    const PROTOCOL = App.getEnv('PROTOCOL'); // 'https';
    const HOST = App.getEnv('HOST'); // '192.168.0.140';
    const PORT = App.getEnv('PORT'); // '8443';
    const PROTOHOST = App.getEnv('PROTOHOST');
    const CRYPTO_SSL_KEY = App.getEnv('CRYPTO_SSL_KEY');
    const CRYPTO_SSL_CERT = App.getEnv('CRYPTO_SSL_CERT');

    console.line();
    console.info(` #http-server: [${PROTOHOST}]`);

    let server = null;

    if( PROTOCOL === 'https' ){
      console.log(`   ssl-key: ${CRYPTO_SSL_KEY}`);
      console.log(`   ssl-cert: ${CRYPTO_SSL_CERT}`);

      const keyFile = `${App.app_root}/crypto/certs/${CRYPTO_SSL_KEY}`;
      const certFile = `${App.app_root}/crypto/certs/${CRYPTO_SSL_CERT}`;

      if( !console.isFile(keyFile) || !console.isFile(certFile) ){
        console.error(` #http-server: keys and/or certs: not found `);
        process.exit();
      }

      const opts = { 
        allowHTTP1: true,
        key: fs.readFileSync(keyFile), 
        cert: fs.readFileSync(certFile), 
      };

      if( !opts.key || !opts.cert ){
        console.error(` #http-server: no [ssl] keys/certs`);
        process.exit();
      }

      // [mod:http2]
      server = http2.createSecureServer( opts, App.express );
      // [mod:https]
      // server = https.createServer( opts, App.express );

    }else{
      // [mod:http]
      server = http.createServer( App.express );

    }

    return server;

  }catch(e){
    console.error(` #http-server: ${e.message} `);
    process.exit();
  }

}


/*

https://github.com/socketio/socket.io-admin-ui/#server-side
https://socket.io/docs/v4/admin-ui/
https://socket.io/docs/v4/server-options/


*/

