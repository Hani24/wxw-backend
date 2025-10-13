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

// /private/courier/position-status/set/

module.exports = function(App, RPath){

  router.use('', async(req, res)=>{

    try{

      const data = req.getPost();
      const mUser = await req.user;
      const mCourier = await req.courier;

      // const verifyAccessRes = App.getModel('Courier').verifyAccess( mCourier );
      // if( !verifyAccessRes.success )
      //   return App.json(res, 417, App.t(verifyAccessRes.message, req.lang), verifyAccessRes.data);

      // if( !mCourier.isOnline )
      //   return App.json(res, 417, App.t(['online-status'], req.lang));

      // NOTE: to be confirmed ....
      // const mCourierShift = await App.getModel('CourierShift').getByCourierId(mCourier.id);

      // if( !App.isObject(mCourierShift) || !App.isPosNumber(mCourierShift.id) )
      //   return App.json( res, false, App.t(['failed-to','get','work-shift'], req.lang) );

      // if( !mCourierShift.isStarted )
      //   return App.json( res, 417, App.t(['start','your','work-shift','first'], req.lang) );

      const validateCoordsRes = App.geo.lib.isValidCoords({
        lat: req.getCommonDataFloat('lat', null),
        lon: req.getCommonDataFloat('lon', null),
      });

      if( !validateCoordsRes.success ){
        console.json({validateCoordsRes});
        return App.json( res, 417, App.t(validateCoordsRes.message, req.lang), validateCoordsRes.data);
      }

      // return await App.json( res, true, App.t(['status','has-been','updated'], res.lang), {
      //   lat: validateCoordsRes.lat,
      //   lon: validateCoordsRes.lon,
      // });

      if( mCourier.lat === validateCoordsRes.data.lat && mCourier.lon === validateCoordsRes.data.lon )
        return await App.json( res, true, App.t(['status','has-been','updated'], res.lang), {
          lat: validateCoordsRes.data.lat,
          lon: validateCoordsRes.data.lon,
        });

      const updateCourier = await mCourier.update({
        lat: validateCoordsRes.data.lat,
        lon: validateCoordsRes.data.lon,
      });

      const updateUser = await mUser.update({
        lat: validateCoordsRes.data.lat,
        lon: validateCoordsRes.data.lon,
      });

      if( !App.isObject(updateCourier) || !App.isPosNumber(updateCourier.id) )
        return App.json( res, false, App.t(['failed','to','set','position','status'], req.lang));

      await App.json( res, true, App.t(['status','has-been','updated'], res.lang), {
        lat: updateCourier.lat,
        lon: updateCourier.lon,
      });

      // [post-processing]

      if( mCourier.hasActiveOrder && App.isPosNumber(mCourier.activeOrderId) ){

        const mOrder = await App.getModel('Order').findOne({
          where: {
            id: mCourier.activeOrderId,
            status: App.getModel('Order').getStatuses().processing,
          },
          attributes: ['id','clientId'],
        });

        if( App.isObject(mOrder) && App.isPosNumber(mOrder.id) && App.isPosNumber(mOrder.clientId) ){

          const emitCourierPositionToClientRes = await App.socket.broadcastToClientByClientId(
            mOrder.clientId, 
            App.getModel('Client').getEvents().livePositionOfCourierUpdated, 
            {
              lat: validateCoordsRes.data.lat,
              lon: validateCoordsRes.data.lon,
            }
          );
          if( !emitCourierPositionToClientRes.success ){
            console.error(`emitCourierPositionToClientRes: ${emitCourierPositionToClientRes.message}`);
            console.json({emitCourierPositionToClientRes});
          }
        }
      }

    }catch(e){
      console.log(e);
      App.onRouteError( req, res, e );
      // App.json( res, false, App.t('request-could-not-be-processed', req.lang) );
    }

  });

  return { router, method: 'POST', autoDoc:{} };

};


