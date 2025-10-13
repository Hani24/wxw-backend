const logger = require('mii-logger.js');
const crypto = require('crypto');
const fs = require('fs');

// console.json({    
//   uniqueGroupName: App.genToken( {len: 32} ),
//   joinLink: App.genToken( {len: 28, encoding: 'base64'} ),
//   bytes: App.genToken( {len: 28, toBuffer: true} ),
// });

const WOORDS = 'lorem ipsum dolor sit amet. consectetur adipisicing elit sed do eiusmod tempor incididunt ut labore. et dolore magna aliqua. ut enim ad minim veniam quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. excepteur sint occaecat cupidatat non proident sunt in culpa qui officia deserunt mollit anim id est laborum.'.split(' ');

const genToken = ({ len=32, toBuffer=false, encoding='hex' }={})=>{
  len = len || 32;
  encoding = encoding || 'hex';
  const bytes = crypto.randomBytes( len );
  return toBuffer ? bytes : bytes.toString( encoding );
}

const randInt = (min, max)=>{ return Math.floor(Math.random() * (max - min + 1)) + min; };
const randFloat = (min, max)=>{ return Math.random() * (max - min + 1) + min; };
const hash = ( data )=>{
  // data = ( typeof data !== 'string' ) ? '' : data;
  return console.hash.sha256( '5eef4356fd14dfe4b769795273ec0383681b47486ee88d18c282b53be8f1b384'+data );
}


const randomMessage = ( {min=2, max=20}={} )=>{
  min = min || 2;
  max = max || 2;
  let msg = [];
  for( let i=0; i<randInt( min, max ); i++ )
    msg.push( WOORDS[ randInt( 0, WOORDS.length -1 ) ] );
  return msg.join(' ');
}

const stripSpecialChars = (mString, max=1024)=>{
  if( typeof mString !== 'string' ) return '';
  let str = mString.trim();

  try{
    const dec = decodeURI(str);
    str = dec;
  }catch(e){}

  return str
    .replace(/[\<\>\{\}\[\]\(\)\?\=\&\|\\\:\;\,\$\*\_]/g, '')
    // .replace(/[^\w]/g, '')
    // .replace(/[\_]*/g, '')
    .substr(0,max)
    .trim();
}

const strip = (mString, max=256)=>{
  if( typeof mString !== 'string' ) return '';
  let str = mString.trim();

  try{
    const dec = decodeURI(str);
    str = dec;
  }catch(e){}

  return str
    .replace(/[\<\>\{\}\?\"\'\\]/g, '')
    .substr(0, max)
    .trim();
}


const ucFirst = ( mString )=>{
  if( typeof mString !== 'string' ) return '';
  mString = (''+mString).trim();
  return (mString.charAt(0).toUpperCase()+((mString.slice(1)).toLowerCase()));
};

// Password must be at least 6 characters and it must contain at least one number or special character

// isValidPassword( 'superpasword', {lower:true, upper:true, nonW:true, digit:true, minLength:8});
const isValidPassword = ( pwd, _params={} )=>{
  // let mPasswordRegExp = new RegExp(/([a-z]{1,32})([A-Z]{1,32})([0-9]{1,32})([\W]{1,32})/);
  // return mPasswordRegExp.test( pwd );
  if( typeof pwd !== 'string' ) return false;

  const params = {
    lower: true, 
    upper: false, 
    nonW: true, 
    digit: true, 
    minLength: 8,
    ..._params
  };

  const res = {
    lower: !!pwd.match(/([a-z]{1,})/),
    upper: !!pwd.match(/([A-Z]{1,})/),
    nonW: !!pwd.match(/([\W_]{1,})/),
    digit: !!pwd.match(/([0-9]{1,})/), // [\d]
  };

  for( const type_t of Object.keys(res) )
    if( params[ type_t ] && !res[ type_t ] ) 
      return false;

  return pwd.length >= params.minLength;

}

const normalizeEmail = ( email )=>{
  if( typeof email !== 'string' ) return false;
  return (''+email).toLowerCase().trim();
}

const isValidEmail = ( email )=>{
  email = normalizeEmail(email);
  if( typeof email !== 'string' ) return false;
  let mEmailRegExp = new RegExp(/^([a-zA-Z0-9\.\-\_\\+\=\$\|]){1,58}([@]{1})([a-zA-Z0-9\.\-\_]){1,58}([\.]){1}(\.)?([a-zA-Z0-9\.\-\_]){1,24}$/);
  return mEmailRegExp.test( email );
}

// +380 123456789
// +1 123456789
// +32 498 40 39 94
const isValidPhone = ( phone )=>{
  if( typeof phone !== 'string' ) return false;
  phone = cleanPhone(phone);
  let mPhoneRegExp = new RegExp(/^([+]?)([\d]{10,13})$/);
  return mPhoneRegExp.test( phone );
}

const cleanNickname = ( data, min=0, max=72 )=>{
  data = stripSpecialChars(data).substr( 0, max ).trim();
  return data;
}

const cleanName = ( data, fullName=true, toLowerCase=true, max=128 )=>{
  if( typeof data !== 'string' ) return false;
  data = stripSpecialChars(data).substr( 0, max ).trim();
  data = (toLowerCase ? data.toLowerCase() : data);

  while( data !== data.replace(/\s\s/g, ' ') )
    data = data.replace(/\s\s/g, ' ').trim();

  data = data.replace(/[\d]/g, '').trim();

  const parts = data.split(' ').map((item)=>{
    const trimmed = item.toString().trim();
    return (toLowerCase ? ucFirst(trimmed) : trimmed);
  });

  if( !parts.length ) return false;

  if( fullName )
    if( parts.length < 2 || !parts[1].length )
      return false;

  return parts.join(' ');
}

const cleanPhone = ( data, min=0, max=13+1 )=>{
  if( typeof data !== 'string' ) return false;
  data = stripSpecialChars(data).substr( 0, max ).trim();
  return `+${data.replace(/[^\d]/g, '').trim()}`;
}

const cleanUrl = ( url )=>{
  if( typeof url !== 'string' ) return false;
  return url.replace(/["'\{\}\[\]\?]/g, '')
    .trim()
    // .toLowerCase()
}

const isUrl = ( url )=>{
  url = cleanUrl(url);
  if( typeof url !== 'string' ) return false;
  // const isValidUrl = !!(url.match(/[https|http]:\/\/[a-z0-9\-\_]\.[a-z]{2,8}.*/));
  const isValidUrl = !!url.match(/^(https|http|ftp|sftp|ssh){1}(\:\/\/){1}(.*)/i);
  return (isValidUrl ? url : false);
}

const cleanCardNumber = ( data, max=16 )=>{
  data = ( typeof data === 'string' ? data : '' )
    .replace(/[^\d]/g,'') 
    // .substr( 0, max )
    .trim();

  return ( data.length !== max )
    ? false
    : data;

}

const cleanCardExpiryDate = ( data )=>{
  data = ( typeof data === 'string' ? data : '' )
  data = data
    .replace(/[^\d\/]/g,'') 
    .trim();

  return ( !data.match(/^(\d\d){1}\/(\d\d){1}$/) )
    ? false
    : data;

}

const cleanCardCVV = ( data )=>{
  data = ( typeof data === 'string' ? data : '' )
  data = data
    .replace(/[^\d]/g, '') 
    .trim();

  // console.debug({cleanCardCVV:{1:data}});
  return ( data.length !== 3 && data.length !== 4 )
    ? false
    : data;

}

const getHumanDate = ( date_0=false, date_1=false )=>{
  let datetime = ( date_0 && date_0 !== '1970-01-01T00:00:00.000Z' ? date_0 : (typeof date_1==='string'?date_1:false) );
  if(typeof datetime !== 'string')
    return false;

  let D = datetime ? new Date( datetime ) : new Date();
  let ISO = D.toISOString().toString();
  ISO = ISO.split('T');
  let time_arr = ISO[1].split('.');
  return ISO[0]+' '+time_arr[0]
}

const msTimeToDate = ( ms_time )=>{
  let D = new Date();
      D.setTime( ms_time );

  let ISO = D.toISOString().toString();
  ISO = ISO.split('T');

  let time_arr = ISO[1].split('.');

  let date = ISO[0];
  let time = time_arr[0];
  let msec = time_arr[1].replace('Z','');
  return date+' '+time+' ('+msec+') ';
}

const dateToFilePrefix = ()=>{
  // "2020-05-15T12:00:55.112Z"
  let D = (new Date());
  let ISO = D.toISOString().toString().split('.')[0];
  return ISO.replace(/\:/g, '.');
}

const timeToDate = ( time )=>{
  return msTimeToDate( time * 1000 );
}

const getUnixTime = ()=>{
  return parseInt( (new Date()).getTime() /1000 );
}
const getTimestamp = ()=>{
  return parseInt((new Date()).getTime()); // JS
}
const getUnixTimeInMS = ()=>{
  return (new Date()).getTime();
}

const saveBase64ToFile = async ( filePath, base64 )=>{
  return new Promise( async(resolve, reject)=>{
    try{

      // console.log({saveBase64ToFile: {filePath}});
      // data:image/png;base64,iVB
      base64 = base64.split('base64,');

      const newData = ( base64[1] || base64[0] ).replace(/\n/g, '');
      const avatarBuffer = Buffer.from( newData, 'base64' );
      fs.writeFile( filePath, avatarBuffer, {flag: 'w'}, (err, res)=>{
        if( err ){
          console.error( err );
          return resolve({success: false, message: err.message});
        }
        resolve({success: true, message: 'OK'});
      });
    }catch(e){
      console.error(` #saveBase64ToFile: exception: ${ e.message }`);
      resolve({success: false, message: e.message});
    }
  });
}


module.exports = (App, params={})=>{

  return {
    genToken,
    randInt,
    randFloat,
    hash,
    randomMessage,
    ucFirst,
    isValidEmail,
    isValidPassword,
    isValidPhone,
    normalizeEmail,
    cleanNickname,
    cleanName,
    cleanPhone,
    cleanUrl,
    isUrl,
    getHumanDate,
    cleanCardNumber,
    cleanCardExpiryDate,
    cleanCardCVV,
    msTimeToDate,
    dateToFilePrefix,
    timeToDate,
    getUnixTime,
    getTimestamp,
    getUnixTimeInMS,
    saveBase64ToFile,
    stripSpecialChars,
    strip,
  }

};


if( module.parent ) return;


const names = [
  'jeff van bentley',
  'omar mcgill',
  'ilyas un griffith',
  'patricia corrigan',
  'scarlette fraser',
  'glenn castaneda',
  'mr emer ellison',
  'dr mae kerr',
  'dr tamera van edge',
  'lawrence young',
  'wrong-name'
];

for( const name of names )
  console.log({ [name] : cleanName( name ) });



console.json({
  p0: isValidPassword( 'sdfSDF@@@123' ) === true,
  p1: isValidPassword( 'sdfSDF@@@' ) === false,
  p2: isValidPassword( '111111111111111' ) === false,
  p3: isValidPassword( 'aaaaaaaaaaaaaaa' ) === false,
  p4: isValidPassword( 'AAAAAAAAAAAAAAA' ) === false,
  p5: isValidPassword( '@@@@@@@@@@@@@@@' ) === false,
});



