const logger = require('mii-logger.js');
const crypto = require('crypto');
const bcrypt = require('bcrypt');

const SALT_ROUNDS = 10;

const hash = async (payload, saltRounds=false)=>{
  try{
    const rounds = saltRounds || SALT_ROUNDS;
    const hash_t = await bcrypt.hash(payload, rounds);
    return hash_t;
  }catch(e){
    console.error(` #BCrypt:hash: ${e.message}`);
    return false;
  }
}

const compare = async (payload, hash_t)=>{
  try{
    const match = payload && hash_t && (await bcrypt.compare(payload, hash_t));
    return match;
  }catch(e){
    console.error(` #BCrypt:compare: ${e.message}`);
    return false;
  }
}

const randomSecureToken = (lenBytes=32)=>{
  try{
    const hexString = crypto.randomBytes( (+lenBytes) || 32 ).toString('hex');
    // >>> 'e5c8244109b67b60a34819263fa457a1d2a7076d94f507b4f7e1b8721165a85b';
    return hexString;
  }catch(e){
    console.error(` #BCrypt:randomSecureToken: ${e.message}`);
    return false;
  }
}

const randomSecureBuffer = (lenBytes=8)=>{
  try{
    const buffer = crypto.randomBytes( (+lenBytes) || 8 );
    return buffer;
  }catch(e){
    console.error(` #BCrypt:randomSecureBuffer: ${e.message}`);
    return false;
  }
}

const randomSecurePassword = ()=>{
  try{

    let pwd = '';

    for( let i=0; i<4; i++ ){
      let segment = crypto.randomBytes(4).toString('hex');
          segment[ console.randInt(0,100) > 50 ? 'toUpperCase' : 'toLowerCase' ]();
      pwd += segment;
      pwd += ( String.fromCharCode( console.randInt(65, 65+25) ) );
      pwd += console.randInt(0, 9);
    }

    return `@-${pwd}`;

  }catch(e){
    console.error(` #BCrypt:randomSecurePassword: ${e.message}`);
    return false;
  }
}


module.exports = (App, params={})=>{
  return {
    hash,
    compare,
    randomSecureToken,
    randomSecurePassword,
    randomSecureBuffer,
  }
}

if( module.parent ) return;

// test
(async()=>{

  const hash_t = await hash('payload');
  const compare_t = await compare('payload', hash_t);
  const sec_buffer_t = await randomSecureToken(32);
  const sec_token_t = await randomSecureToken(32);
  const sec_password_t = await randomSecurePassword();

  console.json({ 
    hash_t, 
    compare_t,
    sec_buffer_t,
    sec_token_t,
    sec_password_t,
  });

  // >> {
  // >>   "hash_t": "$2b$10$Y/VcKwFSxbpj5tIKpt9rpOTC.laSNWT5dyARXnxdp.Fr8Nmd/aK2.",
  // >>   "compare_t": true,
  // >>   "sec_buffer_t": "f5853a4ffd1850326b5f1f802066e817596b3d72bb6f4158449faf304e4f4854",
  // >>   "sec_token_t": "6f6bf711f72ed976d4645f110b6852e345ef5049a2a58a24d286c6d29514d240"
  // >> }
  
})();


