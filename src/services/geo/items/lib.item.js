const logger = require('mii-logger.js');
const geolib = require('geolib');

// "lat": "required: <float>: eg: 52.457566",
// "lon": "required: <float>: eg: 3.4645634"

// 1 degree of latitude covers about 10^7/90 = 111,111 meters
// sixth decimal place in one decimal degree has 111,111/10^6 = about 1/9 meter == 11.111111111 decimal

// places   degrees          distance
// -------  -------          --------
// 0        1                111  km
// 1        0.1              11.1 km
// 2        0.01             1.11 km
// 3        0.001            111  m
// 4        0.0001           11.1 m
// 5        0.00001          1.11 m
// 6        0.000001         11.1 cm
// 7        0.0000001        1.11 cm
// -------  ---------        --------
// 8        0.00000001       1.11 mm
// -------  ----------       --------
// 9        0.000000001      111  μm
// 10       0.0000000001     11.1 μm
// 11       0.00000000001    1.11 μm
// 12       0.000000000001   111  nm
// 13       0.0000000000001  11.1 nm

// update Restaurants set lat=(3.0 + ((rand()/50) -(rand()/50)) ), lon=(3.0 + ((rand()/50) -(rand()/50)) );
// update Couriers set lat=(3.0 + ((rand()/50) -(rand()/50)) ), lon=(3.0 + ((rand()/50) -(rand()/50)) );
// update Clients set lat=(3.0 + ((rand()/50) -(rand()/50)) ), lon=(3.0 + ((rand()/50) -(rand()/50)) );
// update DeliveryAddresses set lat=(3.0 + ((rand()/50) -(rand()/50)) ), lon=(3.0 + ((rand()/50) -(rand()/50)) );

const FEET_TO_METER_CONST = 3.28084;
const FEET_TO_MILE_CONST = 0.000189394;
const KMS_TO_MILES_CONST = 0.621371;

const AVG_DEG_KM = {
  F: {km: 110.475, deg: 1.00 },
  M: {km: 11.0475, deg: 0.10 },
  U: {km: 1.10475, deg: 0.01 },
};

class Geo {

  constructor( App, name, params={} ){
    this.App = App;
    this.name = name;
    this.params = params;
    this._isInited = false;
    this._init();

  }

  _init(){
    try{
      // const M_KEY = this.App.getEnv('M_KEY');
      this._isInited = true;
    }catch(e){
      console.error(` #${this.name}: ${e.message}`);
      return false;
    }
  }

  isInited(){ return this._isInited; }

  fixCoord( coord, toFixed=7 ){ return this.App.getNumber( coord || 0, {toFixed} ); }
  feetsToMeters(value){ return +(value / FEET_TO_METER_CONST).toFixed(2); }
  feetsToMiles(value){ return +(value * FEET_TO_MILE_CONST).toFixed(2); }
  metersToFeets(value){ return +(value * FEET_TO_METER_CONST).toFixed(2); }
  metersToKms(value){ return +(value /1000).toFixed(2); }
  metersToMiles(value){ return +( this.metersToKms(value) * KMS_TO_MILES_CONST ).toFixed(2); }
  milesToKms(value){ return +( value / KMS_TO_MILES_CONST ).toFixed(2); }
  kmToAvgLatLonDeg(value){
    const conf = this.getAvgDegUnits('U');
    return +(value /conf.km *conf.deg).toFixed(4);
  }

  getAvgDegUnits(type_t='U'){
    type_t = (''+type_t).toUpperCase().trim();
    return AVG_DEG_KM.hasOwnProperty(type_t)
      ? AVG_DEG_KM[type_t]
      : {km: -1, deg: -1};
  }

  isValidCoords(mCoords){

    try{

      if( !this.App.isObject(mCoords) )
        return {success: false, message: ['coords','object','is-required']};

      mCoords = (this.App.isFunction( mCoords.toJSON ) ? mCoords.toJSON() : mCoords);

      let lat = ((+mCoords.latitude) || (+mCoords.lat) || null);
      let lon = ((+mCoords.longitude) || (+mCoords.lon) || (+mCoords.lng) || null);

      if( !this.App.isNumber(lat) || !this.App.isNumber(lon) )
        return {success: false, message: ['lat','and','lon','is-required']};

      lat = this.fixCoord( lat );
      lon = this.fixCoord( lon );

      if( lat < -90 || lat > 90 )
        return {success: false, message: ['lat','is-outside','of','valid','range','of','-90','-','+90']};

      if( lon < -180 || lon > 180 )
        return {success: false, message: ['lon','is-outside','of','valid','range','of','0','-','+180']};

      return {success: true, message: ['lat','and','lon','is-valid'], data: {
        lat, 
        lon,
        // geolib => 
        latitude: lat, 
        longitude: lon,
      }};

    }catch(e){
      console.error(`#geo.lib:isValidCoords: ${e.message}`);
      return {success: false, message: e.message};
    }

  }

  getDistance( from={}, to={}, convertTo='meter', convMultiplier=1.0 ){

    try{
      // console.json({getDistance: {from, to}});
      if( !this.isInited() )
        return {success: false, message: `${this.name}: is not inited`};

      const fromRes = this.isValidCoords(from);
      const toRes = this.isValidCoords(to);

      if( !fromRes.success || !toRes.success )
        return {success: false, message: ['invalid','coords']};

      let units = convertTo;
      let distance = 0;

      const meters = geolib
        .getDistance( fromRes.data, toRes.data ) * ((+convMultiplier) || 1.0);

      let isDefault = false;

      switch( convertTo ){
        case 'm': 
        case 'meter': 
        case 'meters': 
          distance = meters;
          break;

        case 'ft': 
        case 'feet': 
        case 'feets': 
          distance = this.metersToFeets(meters);
          break;

        case 'mile': 
        case 'miles': 
          distance = this.metersToMiles(meters);
          break;

        case 'km': 
        case 'kms': 
        case 'kilometer': 
        case 'kilometers': 
        // +- is the same
        case 'yards': 
        case 'yard': 
          units = 'km';
          distance = this.metersToKms(meters);
          break;

        default:
          units = 'km';
          distance = this.metersToKms(meters);
          isDefault = true;

      }

      return {success: true, message: `success`, data: {
        reqUnits: convertTo,
        distance,
        units,
        isDefault,
      }};

    }catch(e){
      console.error(`#geo.lib:getDistance: ${e.message}`);
      return {success: false, message: e.message};
    }

  }

  calcOptimalDistance( pos, list=[], convertTo='km' ){

    try{

      // console.log({pos, list, convertTo});

      if( !this.App.isArray(list) )
        return {success: false, message: ['list','of','points','in','the','route','not','found']};

      const mPosRes = this.isValidCoords(pos);
      if( !mPosRes.success ) return mPosRes;
      const mPos = {
        nextPointDist: 0,
        ...( this.App.isFunction(pos.toJSON) ? pos.toJSON() : pos ),
        ...mPosRes.data,
      };

      let mList = [];
      for( const mCoord of list ){
        const mPosRes = this.isValidCoords(mCoord);
        if( !mPosRes.success ) return mPosRes;
        mList.push({
          nextPointDist: 0,
          ...( this.App.isFunction(mCoord.toJSON) ? mCoord.toJSON() : mCoord ), // id, indexes, etc ....
          ...mPosRes.data,
        });
      }

      const pathRes = [];
      pathRes.push( mPos );
      let from = mPos;
      let distance = 0;
      let units = convertTo;

      while( mList.length ){
        mList = geolib.orderByDistance(from, mList);
        const nearest = mList[0];
        mList.splice(0, 1);
        from.nextPointDist = this.metersToKms( geolib.getPathLength([ from, nearest ]) );
        distance += from.nextPointDist;
        pathRes.push( nearest );
        from = nearest;
      }

      distance = +(distance.toFixed(2));

      switch( convertTo ){
        case 'm': 
        case 'meter': 
        case 'meters': 
          distance = +( distance * 1000 ).toFixed(2);
          break;

        case 'ft': 
        case 'feet': 
        case 'feets': 
          distance = this.metersToFeets( distance * 1000 );
          break;

        case 'mile': 
        case 'miles': 
          distance = this.metersToMiles( distance * 1000 );
          break;

        case 'km': 
        case 'kms': 
        case 'kilometer': 
        case 'kilometers': 
          units = 'km';
          // distance = this.metersToKms(meters);
          // distance = distance;
          break;

      }

      // pathRes.map((mPoint)=>console.log({mPoint}));
      // console.json({ getPathLength:  geolib.getPathLength(pathRes) });
      // return;

      return {success: true, message: 'success', data: {
        reqUnits: convertTo,
        distance,
        units,
        pathRes,
      }};

    }catch(e){
      console.error(`#geo.lib:calcOptimalDistance: ${e.message}`);
      return {success: false, message: e.message};
    }

  }

}

module.exports = (App, name, params={})=>{
  return new Geo(App, name, params);
}


if( module.parent ) return;

(async()=>{

  const mPos = { id: 0, latitude: 10, longitude: 10, nextPointDist: 0 };
  let mList = console.deepClone([
    { id: 1, latitude: 9.91, longitude: 9.91, nextPointDist: 0 },
    { id: 2, latitude: 9.91, longitude: 10.02, nextPointDist: 0 },
    { id: 3, latitude: 10.03, longitude: 9.92, nextPointDist: 0 },
    { id: 4, latitude: 9.985, longitude: 10.074, nextPointDist: 0 },
    { id: 5, latitude: 9.965, longitude: 9.985, nextPointDist: 0 },
    { id: 6, latitude: 10.025, longitude: 9.955, nextPointDist: 0 },
  ]);

  const pathRes = [];
  pathRes.push( mPos );
  let from = mPos;
  let totalPathLengthInMeters = 0;

  while( mList.length ){

    mList = geolib.orderByDistance(from, mList);
    const nearest = mList[0];
    mList.splice(0, 1);

    // console.log({nearest});
    // console.log( mList.length, from );
    from.nextPointDist = geolib.getPathLength([ from, nearest ]);
    totalPathLengthInMeters += from.nextPointDist;

    pathRes.push( nearest );
    from = nearest;

  }

  // const totalPathLengthInMiles = this.metersToMiles(totalPathLengthInMeters);
  console.debug({totalPathLengthInMeters});
  pathRes.map((mPoint)=>console.log({mPoint}));
  console.json({ getPathLength:  geolib.getPathLength(pathRes) });
  return;

  // const orderByDistance = geolib.orderByDistance({ latitude: 51.515, longitude: 7.453619 }, [
  //   { latitude: 52.516272, longitude: 13.377722 },
  //   { latitude: 51.518, longitude: 7.45425 },
  //   { latitude: 51.503333, longitude: -0.119722 },
  // ]);
  // console.json({orderByDistance});

  // const findNearest = geolib.findNearest({ latitude: 52.456221, longitude: 12.63128 }, [
  //   { latitude: 52.516272, longitude: 13.377722 },
  //   { latitude: 51.515, longitude: 7.453619 },
  //   { latitude: 51.503333, longitude: -0.119722 },
  //   { latitude: 55.751667, longitude: 37.617778 },
  //   { latitude: 48.8583, longitude: 2.2945 },
  //   { latitude: 59.3275, longitude: 18.0675 },
  //   { latitude: 59.916911, longitude: 10.727567 },
  // ]);
  // console.json({findNearest});

  // const getPathLength = geolib.getPathLength([
  //   { latitude: 52.516272, longitude: 13.377722 },
  //   { latitude: 51.515, longitude: 7.453619 },
  //   { latitude: 51.503333, longitude: -0.119722 },
  // ]);
  // console.json({getPathLength});







  // const App = {
  //   getNumber: (value)=>(+value),
  // };

  // const mGeo = new Geo(App, 'name', {});

  // // const from = { lat: -0.01, lon: 0 };
  // // const to = { lat: 0.01, lon: 0 }

  // const from = { lat: 0, lon: 0 };
  // const to = { lat: 0, lon: 0.1 };

  // console.json({
  //   feets: mGeo.getDistance( from, to, {useFeets: true} ),
  //   meters: mGeo.getDistance( from, to ),
  // });

})();
