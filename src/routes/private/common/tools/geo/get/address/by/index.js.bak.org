const express = require('express');
const router = express.Router();

// {
//   "// POST": "...",
//   "lat": "required: <float>: eg: 36.9746434",
//   "lon": "required: <float>: eg: -120.1195329",
//   "type": "required: ENUM: <string>: [ google | osm | leaflet ]",
//   "// GET": "/private/common/tools/geo/get/address/by/lat/:lat/lon/:lon/type/:type"
// }

// {
//   "// POST": "...",
//   "lat": 36.9746434,
//   "lon": -120.1195329,
//   "type": "google",
//   "// GET": "/private/common/tools/geo/get/address/by/lat/:lat/lon/:lon/type/:type"
// }

// /private/common/tools/geo/get/address/by/lat/:lat/lon/:lon/type/:type

module.exports = function(App, RPath){

  router.use('', async(req, res)=>{

    try{

      const data = req.getPost();
      const mUser = await req.user;

      const lat = req.getCommonDataFloat('lat', null);
      const lon = req.getCommonDataFloat('lon', null);
      const type = req.getCommonDataString('type', null);
      if( App.isEnv('dev') ) console.debug({lat, lon, type});

      const validateCoordsRes = App.geo.lib.isValidCoords({ lat, lon });
      if( !validateCoordsRes.success )
        return App.json( res, 417, App.t(validateCoordsRes.message, req.lang), validateCoordsRes.data);

      if( !App.geo.tools.isValidCoordsType(type) )
        return App.json(res, 417, App.t(['coords-taken-from','option','is-not','valid'],req.lang), {
          types: App.geo.tools.getValidCoordsTypes(),
        } );

      const geoRes = await App.geo.tools.getAddressInfoByCoords(validateCoordsRes.data, type);

      if( !geoRes.success ){
        console.json({geoRes});
        return App.json(res, 417, App.t( geoRes.message, req.lang), geoRes.data );
      }

      if( App.isEnv('dev') ) console.json(geoRes.data);

      App.json(res, true, App.t(['success'],req.lang), geoRes.data );

    }catch(e){
      console.log(e);
      App.onRouteError( req, res, e );
      // App.json( res, false, App.t('request-could-not-be-processed', req.lang) );
    }

  });

  return { router, method: '', autoDoc:{} };

};


