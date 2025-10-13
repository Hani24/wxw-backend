const logger = require('mii-logger.js');
const crypto = require('crypto');

const {
  generateKeyPairSync, createSign, createVerify,
} = crypto;

const RSA_SEC_KEY = process.env.RSA_SEC_KEY || 'test.sec.key';
const RSA_PUB_KEY = process.env.RSA_PUB_KEY || 'test.pub.key';
const RSA_MODULUS_LENGTH = (+process.env.RSA_MODULUS_LENGTH) || 4096;

const RSA_SEC_KEY_CIPHER = process.env.RSA_SEC_KEY_CIPHER || 'aes';
const RSA_SEC_KEY_PASSPHRASE = process.env.RSA_SEC_KEY_PASSPHRASE || '';

class RSA {

  constructor(App, params={}){
    this.App = App;
    this.params = params;
    this.rsaRoot = `${this.App.root}/src/crypto/rsa`;
    this._keys = {
      pub: false,
      sec: false,
    }

    this._isReady = false;
    this._init();
  }

  isReady(){ return this._isReady; }

  async _init(){

    try{

      if( !this.initKeys() ){
        this.createKeys();
        if( !this.initKeys() ){
          console.log(`failed to init [rsa] keys`);
          return false;
        }
      }

      this._isReady = true;

    }catch(e){
      console.error(`#RSA:_init ${e.message}`);
    }

  }

  encrypt(rawData){
    try{

      if( !this.isReady() )
        return resolve({ success: false, message: ['service','RSA','is-not','ready'], data: null });

      const buffer = Buffer.from(rawData);
      const encBuffer = crypto.publicEncrypt(this._keys.pub, buffer);
      const encBase64 = encBuffer.toString("base64");
      return {success: true, message: 'OK', data: encBase64 };
    }catch(e){
      console.error(`#RSA:encrypt: ${e.message}`);
      return { success: false, message: ['failed-to','encrypt','data'], data: null };
    }
  }

  decrypt(encBase64){
    try{

      if( !this.isReady() )
        return resolve({ success: false, message: ['service','RSA','is-not','ready'], data: null });

      const encBuffer = Buffer.from(encBase64, "base64");
      const decBuffer = crypto.privateDecrypt(this._keys.sec, encBuffer);
      const rawData = decBuffer.toString("utf8");
      return {success: true, message: 'OK', data: rawData };
    }catch(e){
      console.error(`#RSA:decrypt: ${e.message}`);
      return { success: false, message: ['failed-to','decrypt','data'], data: null };
    }
  }

  initKeys(data){
    try{

      const rsaSecFile = `${this.rsaRoot}/${RSA_SEC_KEY}`;
      const rsaPubFile = `${this.rsaRoot}/${RSA_PUB_KEY}`;

      if( !console.isFile( rsaSecFile ) ){
        console.error(`#RSA:initKeys: sec-key not found`);
        return false;
      }

      this._keys.sec = console.readFileSync( rsaSecFile );
      this._keys.pub = console.readFileSync( rsaPubFile );
      return true;

    }catch(e){
      console.error(`#RSA:initKeys: ${e.message}`);
      return false;
    }
  }

  createKeys(data){
    try{

      const rsaSecFile = `${this.rsaRoot}/${RSA_SEC_KEY}`;
      const rsaPubFile = `${this.rsaRoot}/${RSA_PUB_KEY}`;

      if( console.isFile(rsaSecFile) || console.isFile(rsaPubFile) ){
        console.error('#RSA:createKeys: key already exists...');
        return false;
      }

      const { privateKey, publicKey } = generateKeyPairSync('rsa', {
        modulusLength: RSA_MODULUS_LENGTH,
      });

      const pubKey = publicKey.export({
        type: 'pkcs1', // 'spki'.
        format: 'pem', // 'der', or 'jwk'.
      });

      const secKey = privateKey.export({
        type: 'pkcs1', // 'pkcs8' or 'sec1' (EC only). => best 'pkcs8' if key is encrypted
        format: 'pem', // 'der', or 'jwk'.

        // [optional] pk-cipher
        // cipher: <string> If specified, the private key will be encrypted with the given cipher and passphrase using PKCS#5 v2.0 password based encryption.
        // passphrase: <string> | <Buffer> The passphrase to use for encryption, see cipher.
      });

      console.writeFileSync( rsaSecFile, secKey );
      console.writeFileSync( rsaPubFile, pubKey );
      return { success: true, message: 'success', data: {pubKey, secKey} };

    }catch(e){
      console.error(`#RSA:createKeys: ${e.message}`);
      return { success: false, message: 'Failed to init keys' };
    }
  }


  _hash( func='sha256', rawData, fromEncoding='utf-8', toEncoding='hex' ){
    try{
      const hash = crypto.createHash( func )
        .update(rawData, fromEncoding)
        .digest( toEncoding );
      return { success: true, message: 'success', data: {hash} };
    }catch(e){
      console.error(`#RSA:_hash: ${e.message}`);
      return { success: false, message: ['Failed to create hash',func], data: null };
    }
  }

  sha1( rawData, fromEncoding='utf-8', toEncoding='hex' ){
    return this._hash( 'sha1', rawData, fromEncoding, toEncoding );
  }

  sha256( rawData, fromEncoding='utf-8', toEncoding='hex' ){
    return this._hash( 'sha256', rawData, fromEncoding, toEncoding );
  }

  sha384( rawData, fromEncoding='utf-8', toEncoding='hex' ){
    return this._hash( 'sha384', rawData, fromEncoding, toEncoding );
  }

  sha512( rawData, fromEncoding='utf-8', toEncoding='hex' ){
    return this._hash( 'sha512', rawData, fromEncoding, toEncoding );
  }

  _hashFile( func='sha256', fileName, fromEncoding='utf-8', toEncoding='hex' ){
    try{

      if( console.isDir(fileName) )
        return { success: false, message: 'Cannot create hash of directory', data: null };

      if( !console.isFile(fileName) )
        return { success: false, message: 'Provided file is not valid file', data: null };

      const rawData = console.readFileSync( fileName, fromEncoding );
      const hash = crypto.createHash( func )
        .update(rawData, fromEncoding)
        .digest( toEncoding );
      return { success: true, message: 'success', data: {hash} };
    }catch(e){
      console.error(`#RSA:_hash: ${e.message}`);
      return { success: false, message: ['Failed to create hash',func], data: null };
    }
  }

  sha1File( fileName, fromEncoding='utf-8', toEncoding='hex' ){
    return this._hashFile( 'sha1', fileName, fromEncoding, toEncoding );
  }

  sha256File( fileName ){
    return this._hashFile( 'sha256', fileName, fromEncoding, toEncoding );
  }

  sha384File( fileName ){
    return this._hashFile( 'sha384', fileName, fromEncoding, toEncoding );
  }

  sha512File( fileName ){
    return this._hashFile( 'sha512', fileName, fromEncoding, toEncoding );
  }

}

module.exports = async(App, params={})=>{
  return new RSA(App, params);
}

if( module.parent ) return;



(async()=>{

  // https://nodejs.org/api/crypto.html#crypto_class_keyobject

  const mRSA = new RSA({root: `${__dirname}/../../../`}, {});
  // mRSA.createKeys();

  const encBase64 = mRSA.encrypt('abc-123');
  const rawData = mRSA.decrypt(encBase64);
  console.json({
    encBase64,
    rawData,
  });

  // [00:22:33][L] : {
  // [00:22:33][L] :   "encBase64": "NM0BoMRuIBts2QlBQjnSpgMM3z4SM7oO/PCWqo/XOpGSYhO//vq6pM/HuVCvGMtoqzYyG70OtVOxYHaKy1NT9qr+iXhkFbXTOwB7tP2H2ox8WPvE2M1jS5KUhITFcGmUvV4FIwlqxv6QiN6PTS6p5GegiyEhpEZE7TxQQbIn/PribnfEWNcApZPU+aICthnLp7uM9BT7pQs7rfqqvcU/4ogq7jIwsAIieVfBDY4IsHbNMy5eAIfSUzdW9WtsR1AFH8OnBUMTdRy6wAp2j78uONUyRNY6RLuXxgccK6qkeCP7j5Q0w2JspIySsMSqtXn7Imo0HLfHyhGqBDwCJA6LPm+NirJQ5kndRz/95WS5bnY4GqC7pf3WMXPKXL2GCUz3glZpB/C3NZdI7uCFyW010+TCpVvWx0DiR5hmhxdMGzCNfaG6UY4AmLevZtFzddspUzGA9bXIKMxrOtixs17a0uMo5wZSe3CUpSAqTAIDtwSxgpVkbb5LQB946sZFN0iwwdVVIMyeOC0p9rMY2O+iH9nO1YAf2yy3FGuVjpH+TlbRZollIc/iL7nEpIBKg6UxrcfCic5RkRswa8DjrahK+V3cZnGY2A54n7AInLTxmZ9G6qzI6JVgZWktphUexnzbFcd5llZwMaqjPVrsiemyt55rRE+mHkVRKFA4aY7WPR0=",
  // [00:22:33][L] :   "rawData": "abc-123"
  // [00:22:33][L] : }

  return;

  const toEncrypt = 'hello world';

  const rsaPubUtf8 = console.readFileSync(RSA_PUB_KEY);
  const toEncBuffer = Buffer.from(toEncrypt);
  const encrypted = crypto.publicEncrypt(rsaPubUtf8, toEncBuffer);
  const base64 = encrypted.toString("base64");
  console.log({base64});

  const rsaSecUtf8 = console.readFileSync(RSA_SEC_KEY);
  const encBuffer = Buffer.from(base64, "base64");
  const decrypted = crypto.privateDecrypt(rsaSecUtf8, encBuffer);
  console.log({dec: decrypted.toString("utf8") });

})();

