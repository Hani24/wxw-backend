const logger = require('mii-logger.js');

// https://googlemaps.github.io/google-maps-services-js/
const {Client} = require("@googlemaps/google-maps-services-js");

const TravelRestriction = {
  tolls: 'tolls',
  highways: 'highways',
  ferries: 'ferries',
  indoor: 'indoor',
};

const TrafficModel = {
  best_guess: 'best_guess',
  pessimistic: 'pessimistic',
  optimistic: 'optimistic',
};

const UnitSystem = {
  metric: 'metric',
  imperial: 'imperial',
};

const TravelMode = {
  driving: 'driving',
  walking: 'walking',
  bicycling: 'bicycling',
  transit: 'transit',
};

class Maps {

  constructor( App, name, params={} ){
    this.App = App;
    this.name = name;
    this.params = params;
    this._isInited = false;
    this.client = null;
    this.GOOGLE_MAPS_API_KEY = null;
    this._init();
  }

  _init(){
    try{
      this.GOOGLE_MAPS_API_KEY = this.params.GOOGLE_MAPS_API_KEY || this.App.getEnv('GOOGLE_MAPS_API_KEY');
      this.client = new Client({});
      this._isInited = true;
    }catch(e){
      console.error(` #${this.name}: ${e.message}`);
      return false;
    }
  }

  isInited(){ return this._isInited; }

  // async getCoordsFromAddress( {country='US', state='', city='', zip='', street=''}={} ){
  //   try{

  //   }catch(e){
  //     console.error(`#${this.name}:getCoordsFromAddress: ${e.message}`);
  //     return {success: false, message: e.message};
  //   }
  // }

  get TravelRestriction(){ return console.deepClone(TravelRestriction); } 
  get TrafficModel(){ return console.deepClone(TrafficModel); } 
  get UnitSystem(){ return console.deepClone(UnitSystem); } 
  get TravelMode(){ return console.deepClone(TravelMode); } 

  convertToLatLng( arrayOrObject ){
    return this.App.isObject(arrayOrObject)
      ? { lat: arrayOrObject.lat, lng: arrayOrObject.lng || arrayOrObject.lon }
      : arrayOrObject.map((item)=>{
          return { lat: item.lat, lng: item.lng || item.lon }
        });
  }

  getDistanceMatrixRequestParams(){
    return /*params:*/ {
      origins: [], // LatLng[];
      destinations: [], // LatLng[];
      mode: this.TravelMode.driving, // TravelMode;
      language: 'US', // string;
      region: '', // string;
      avoid: [ // TravelRestriction[];
        this.TravelRestriction.tolls,
        this.TravelRestriction.highways,
        // this.TravelRestriction.ferries,
        // this.TravelRestriction.indoor,
      ], 
      units: this.UnitSystem.imperial, // UnitSystem;
      // NOTE: You can specify either `departure_time` or `arrival_time`, but not both.
      // arrival_time: null, // Date | number;
      departure_time: Math.floor(Date.now()/1000), // Date | number;
      traffic_model: // TrafficModel
        this.TrafficModel.best_guess,
        // this.TrafficModel.optimistic,
      // transit_mode: [], // TransitMode[];
      // transit_routing_preference: [], // TransitRoutingPreference;
      key: this.GOOGLE_MAPS_API_KEY,
    };
  }

  async calcDistance( origins=[], destinations=[] ){

    try{
      // console.debug({calcDistance: {origins, destinations}});

      if( 
        (!Array.isArray(origins) || !origins.length )
        ||
        (!Array.isArray(destinations) || !destinations.length )
      ) return {success: false, message: 'Empty origins and/or destinations'};

      const params = this.getDistanceMatrixRequestParams();
      params.origins = this.convertToLatLng(origins); // .push({lat:50.8591767,lng:3.5912273}); // https://www.google.com/maps/@50.8591767,3.5912273,14z
      params.destinations = this.convertToLatLng(destinations); // .push({lat:50.8464429,lng:3.6465881}); // https://www.google.com/maps/@50.8464429,3.6465881,14z
      // console.json({params});

      const distanceRes = await this.client.distancematrix({params});
      const data = distanceRes.data;
      // console.json({data});
      if( !this.App.isArray(data.rows) || !data.rows.length )
        return {success: false, message: '0: Failed to calculate delivery route.'};

      const lastRow = data.rows[ data.rows.length -1 ];
      if( !this.App.isArray(lastRow.elements) || !lastRow.elements.length )
        return {success: false, message: '1: Failed to calculate delivery route.'};

      const topOfFirst = lastRow.elements[ lastRow.elements.length -1 ];
      const meter = (+topOfFirst.distance.value);
      const seconds = (+topOfFirst.duration.value);

      // const meter = data.rows
      //   .map((row)=>{
      //     return row.elements
      //       .map((v)=>(v.distance.value))
      //       .reduce((prev,curr)=>(prev+curr));
      //   }).reduce((prev,curr)=>(prev+curr));

      const feet = this.App.geo.lib.metersToFeets(meter);
      const kilometer = this.App.geo.lib.metersToKms(meter);
      const mile = this.App.geo.lib.feetsToMiles(feet);

      data.distance = {
        meter,
        feet,
        kilometer,
        mile,
      };

      data.duration = {
        seconds,
        humanTime: this.App.DT.moment( this.App.DT.moment().add(seconds,'seconds') ).fromNow(),
      };

      delete data.rows;
      delete data.status;

      return {success: true, message: 'success', data};

    }catch(e){
      logger.log(e);
      console.warn(e.message);
      // console.log(e);
      return {success: false, message: 'Could not get distance', data:{}};
    }
  }

  // wayPoints == [ {lat,lon}, {lat,lon}, {lat,lon}, ]
  async calcDistanceOnWayPoints( wayPoints=[] ){

    try{

      // console.debug({wayPoints});
      // return {success: false, message: 'break',data: {}};

      if( !Array.isArray(wayPoints) || !wayPoints.length ) 
        return {success: false, message: 'Empty way-points'};

      if( wayPoints.length <= 1 || (wayPoints.length *2)%2 !== 0 )
        return {success: false, message: 'No way-points'};

      wayPoints = wayPoints.map((wp)=>({
        // ...wp,
        lat: wp.lat,
        lng: wp.lng || wp.lon, // googles notation ...
        name: wp.name,
      }));

      const origins = [];
      const destinations = [];

      for( let i=0; i<wayPoints.length; i++ ){
        if( !wayPoints[ i+1 ] ){
          // destinations.push( wayPoints[ i+0 ] );
          break;
        }else{
          origins.push( wayPoints[ i+0 ] );
          destinations.push( wayPoints[ i+1 ] );
        }
      }

      
      // const origins = [ wayPoints[0] ];
      // const destinations = [ wayPoints.filter((wp,i)=>(i!=0)).map((wp)=>wp) ];

      return await this.calcDistance( origins, destinations );

    }catch(e){
      console.debug(e.message);
      console.log(e);
      return {success: false, message: 'Could not get distance', data:{}};
    }
  }

}

module.exports = (App, name, params={})=>{
  return new Maps(App, name, params);
};

if( module.parent ) return;
(async()=>{

  const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY || '';
  const mMaps = new Maps( {}, 'Maps', {GOOGLE_MAPS_API_KEY});

  try{
    const distanceRes = await mMaps.calcDistance(
      [{lat:50.8591767,lng:3.5912273}],
      [{lat:50.8464429,lng:3.6465881}]
    );

    // console.json(distanceRes);

    // {
    //   "success": true,
    //   "message": "success",
    //   "data": {
    //     "destination_addresses": [
    //       "Ganzendries 30, 9700 Oudenaarde, Belgium"
    //     ],
    //     "origin_addresses": [
    //       "Industriepark de Bruwaan 27e, 9700 Oudenaarde, Belgium"
    //     ],
    //     "distance": { "text": "5.2 mi", "value": 8353 }, // "value": 8353 === kms
    //     "duration": { "text": "12 mins", "value": 696 }, // "value": 696 === seconds
    //     "rows": [
    //       {
    //         "elements": [
    //           {
    //             "distance": { "text": "5.2 mi", "value": 8353 }, // "value": 8353 === kms
    //             "duration": { "text": "12 mins", "value": 696 }, // "value": 696 === seconds
    //             "duration_in_traffic": { "text": "12 mins", "value": 698 },
    //             "status": "OK"
    //           }
    //         ]
    //       }
    //     ],
    //     "status": "OK"
    //   }
    // }


  }catch(e){
    console.log(e);
  }

})();

/*
export interface DistanceMatrixRequest{
  params: {
    origins: LatLng[];
    destinations: LatLng[];
    mode?: TravelMode;
    language?: string;
    region?: string;
    avoid?: TravelRestriction[];
    units?: UnitSystem;
    arrival_time?: Date | number;
    departure_time?: Date | number;
    traffic_model?: TrafficModel;
    transit_mode?: TransitMode[];
    transit_routing_preference?: TransitRoutingPreference;
  } & RequestParams;
}

// https://github.com/googlemaps/google-maps-services-js/blob/master/src/common.ts

export enum TravelMode {
  // * (default) indicates standard driving directions using the road network. 
  driving = "driving",
  // * requests walking directions via pedestrian paths & sidewalks (where available). 
  walking = "walking",
  // * requests bicycling directions via bicycle paths & preferred streets (where available). 
  bicycling = "bicycling",
 
  // * requests directions via public transit routes (where available).
  // * If you set the mode to transit, you can optionally specify either a departure_time or an arrival_time.
  // * If neither time is specified, the departure_time defaults to now (that is, the departure time defaults to the current time).
  // * You can also optionally include a transit_mode and/or a transit_routing_preference.
  transit = "transit",
};


export enum UnitSystem {
  // * specifies usage of the metric system. Textual distances are returned using kilometers and meters. 
  metric = "metric",
  // * specifies usage of the Imperial (English) system. Textual distances are returned using miles and feet. 
  imperial = "imperial",
}

export enum TrafficModel {
  // * indicates that the returned `duration_in_traffic` should be the best estimate of travel time given what is known about
  // * both historical traffic conditions and live traffic. Live traffic becomes more important the closer the `departure_time` is to now.
  best_guess = "best_guess",
  // * indicates that the returned `duration_in_traffic` should be longer than the actual travel time on most days,
  // * though occasional days with particularly bad traffic conditions may exceed this value. 
  pessimistic = "pessimistic",
   // * indicates that the returned `duration_in_traffic` should be shorter than the actual travel time on most days,
  // * though occasional days with particularly good traffic conditions may be faster than this value.
  optimistic = "optimistic",
}

export type LatLngArray = [number, number];

export type LatLngString = string;

export interface LatLngLiteral {
  lat: number;
  lng: number;
}

export interface LatLngLiteralVerbose {
  latitude: number;
  longitude: number;
}

// * A latitude, longitude pair. The API methods accept either:
// *  - a two-item array of [latitude, longitude];
// *  - a comma-separated string;
// *  - an object with 'lat', 'lng' properties; or
// *  - an object with 'latitude', 'longitude' properties.
export type LatLng = | LatLngArray | LatLngString | LatLngLiteral | LatLngLiteralVerbose;

export enum TravelRestriction {
  // * indicates that the calculated route should avoid toll roads/bridges. 
  tolls = "tolls",
  // * indicates that the calculated route should avoid highways. 
  highways = "highways",
  // * indicates that the calculated route should avoid ferries. 
  ferries = "ferries",
  // * indicates that the calculated route should avoid indoor steps for walking and transit directions.
  // * Only requests that include an API key or a Google Maps APIs Premium Plan client ID will receive indoor steps by default.
  indoor = "indoor",
}

*/
