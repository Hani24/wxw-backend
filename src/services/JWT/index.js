const logger = require('mii-logger.js');
const jwt = require('jsonwebtoken');

const JWT_SECRET_KEY = process.env.JWT_SECRET_KEY || '9ZX23d547d2f0';

const passport = require('passport');
const passportJWT = require('passport-jwt');

const ExtractJwt = passportJWT.ExtractJwt;
const JwtStrategy = passportJWT.Strategy;

const jwtOptions = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: JWT_SECRET_KEY,
};

const sign = (payload)=>{
  try{
    return jwt.sign(payload, jwtOptions.secretOrKey);
  }catch(e){
    console.error(` #JWT:sign: ${e.message}`);
    return false;
  }
}

const verify = (payload)=>{
  try{
    return jwt.verify(payload, jwtOptions.secretOrKey);
  }catch(e){
    console.error(` #JWT:verify: ${e.message}`);
    return false;
  }
}

// var decoded = jwt.decode(token, {complete: true});
const decode = (payload, complete=false)=>{
  try{
    return jwt.decode(payload, {complete, secretOrKey: jwtOptions.secretOrKey});
  }catch(e){
    console.error(` #JWT:decode: ${e.message}`);
    return false;
  }
}

const getSecretKey = ()=>{
  try{
    return jwtOptions.secretOrKey || JWT_SECRET_KEY;
  }catch(e){
    console.error(` #JWT:getSecretKey: ${e.message}`);
    return false;
  }
}

const getOptions = ()=>{
  try{
    return jwtOptions;
  }catch(e){
    console.error(` #JWT:getOptions: ${e.message}`);
    return false;
  }
}

const setSecretKey = (secretKey=false)=>{
  try{
    if( secretKey ){
      jwtOptions.secretOrKey = secretKey;
      return true;
    }
  }catch(e){
    console.error(` #JWT:setSecretKey: ${e.message}`);
  }
  return false;
}


module.exports = (App, params={})=>{
  return {
    sign,
    verify,
    decode,
    getSecretKey,
    getOptions,
    setSecretKey,
    jwt,
    passport,
    passportJWT,
    ExtractJwt,
    JwtStrategy,
  }
}

if( module.parent ) return;

// test
(async()=>{

  const sign_t = await sign({id: 123, name: 'Bob'});
  const verify_t = await verify(sign_t);
  const decode_t = await decode(sign_t);

  const getSecretKey_t = await getSecretKey();
  const getOptions_t = await getOptions();

  console.json({ 
    sign_t,
    verify_t,
    decode_t,
    getSecretKey_t,
    getOptions_t,
  });

  // >> {
  // >>   "sign_t": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MTIzLCJuYW1lIjoiQm9iIiwiaWF0IjoxNjA2MTQ0NzAxfQ.vn9Yj4WAZurpjOGIczBiwY_VgIgCvUanPGs4CTo2kbM",
  // >>   "verify_t": {
  // >>     "id": 123,
  // >>     "name": "Bob",
  // >>     "iat": 1606144701
  // >>   },
  // >>   "decode_t": {
  // >>     "id": 123,
  // >>     "name": "Bob",
  // >>     "iat": 1606144701
  // >>   },
  // >>   "getSecretKey_t": "9ZX23d547d2f0",
  // >>   "getOptions_t": {
  // >>     "secretOrKey": "9ZX23d547d2f0"
  // >>   }
  // >> }

})();


