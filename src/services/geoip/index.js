const logger = require('mii-logger.js');
const geoip = require('geoip-lite');

module.exports = async( App, appParams={} )=>{

  console.line();
  console.log(` #geoip: init`);

  // const ip = "207.97.227.239";
  // const geo = geoip.lookup(ip);
  // console.json(geo);
 
  // {
  //   "range": [ 3479298048, 3479300095 ],
  //   "country": "US",
  //   "region": "TX",
  //   "eu": "0",
  //   "timezone": "America/Chicago",
  //   "city": "San Antonio",
  //   "ll": [ 29.4969, -98.4032 ],
  //   "metro": 641,
  //   "area": 1000
  // } 

  console.ok(` #geoip: init`);
  return async( ip )=>{
    try{

      const geoIpRes = await geoip.lookup( ip );
      if( !geoIpRes )
        return {success: false, message: 'Could not resolve data', data: {ip}};

      return {success: true, message: 'OK', data: {...geoIpRes, ip}};
    }catch(e){
      console.warn(` #service:geoip: ${e.message}`);
      return {success: false, message: 'Could not get Geo-Data'};
    }
  };
}

if( module.parent ) return;

(async()=>{

  const service = await module.exports({},{});
  const geoIpRes = await service('141.135.200.102');
  console.json({ geoIpRes });

  // >> {
  // >>   "geoIpRes": {
  // >>     "success": true,
  // >>     "message": "OK",
  // >>     "data": {
  // >>       "range": [
  // >>         2374486016,
  // >>         2374486527
  // >>       ],
  // >>       "country": "BE",
  // >>       "region": "VLG",
  // >>       "eu": "1",
  // >>       "timezone": "Europe/Brussels",
  // >>       "city": "Ooike",
  // >>       "ll": [
  // >>         50.8667,
  // >>         3.55
  // >>       ],
  // >>       "metro": 0,
  // >>       "area": 10
  // >>     }
  // >>   }
  // >> }


})();

