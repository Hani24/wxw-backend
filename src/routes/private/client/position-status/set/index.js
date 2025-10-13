const express = require('express');
const router = express.Router();

// {
//   "lat": "required: <float>: eg: 52.457566",
//   "lon": "required: <float>: eg: 3.4645634"
// }

// {
//   "lat": 52.457567,
//   "lon": 3.4645635
// }

// /private/client/position-status/set/

module.exports = function(App, RPath){

  router.use('', async(req, res)=>{

    try{

      const data = req.getPost();
      const mUser = await req.user;
      const mClient = await req.client;

      const validateCoordsRes = App.geo.lib.isValidCoords({
        lat: req.getCommonDataFloat('lat', null),
        lon: req.getCommonDataFloat('lon', null),
      });

      if( !validateCoordsRes.success )
        return App.json( res, 417, App.t(validateCoordsRes.message, req.lang), validateCoordsRes.data);

      const updateRes = await mClient.update( validateCoordsRes.data );

      if( !App.isObject(updateRes) || !App.isPosNumber(updateRes.id) )
        return App.json( res, false, App.t(['failed','to','set','position','status'], req.lang));

      App.json( res, true, App.t(['status','has-been','updated'], res.lang), {
        lat: updateRes.lat,
        lon: updateRes.lon,
      });

    }catch(e){
      console.log(e);
      App.onRouteError( req, res, e );
      // App.json( res, false, App.t('request-could-not-be-processed', req.lang) );
    }

  });

  return { router, method: 'POST', autoDoc:{} };

};


