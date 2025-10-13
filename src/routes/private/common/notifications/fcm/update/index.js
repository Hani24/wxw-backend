const express = require('express');
const router = express.Router();

// {
//   "fcmPushToken": "required: <string> (client) fcm-token",
//   "deviceId": "required: <string> 'unique' device-id"
// }

// {
//   "fcmPushToken": "some-token",
//   "deviceId": "some-device-id"
// }

// /private/common/notifications/fcm/update/

module.exports = function(App, RPath){

  router.use('', async(req, res)=>{

    try{

      const mUser = await req.user;
      const mSession = await req.session;

      const fcmPushToken = req.getCommonDataString('fcmPushToken', null);
      if( !App.isString(fcmPushToken) )
        return App.json( res, 417, App.t(['fcm','push','token','is-required'], res.lang));

      const deviceId = req.getCommonDataString('deviceId', null);
      if( !App.isString(deviceId) )
        return App.json( res, 417, App.t(['device','id','is-required'], res.lang));

      console.debug({
        userId: mUser.id,
        deviceId, 
        fcmPushToken: `${fcmPushToken.substr(0, 12)}...`,
      });

      // console.debug({fcmPushToken: `${fcmPushToken.substr(0, 20)}...`});
      // console.debug({deviceId});

      const mF_Session = await App.getModel('Session').findOne({
        where: {
          isDeleted: false, 
          userId: mUser.id,
          fcmPushToken, 
          deviceId,          
        }
      });
      // console.json({});

      if( App.isObject(mF_Session) && App.isPosNumber(mF_Session.id) ){
        console.debug(` deviceId: ${deviceId} => already exists... `);
        return App.json( res, true, App.t(['success'], res.lang));
      }

      const updateSessionRes = await mSession.update({
        fcmPushToken,
        deviceId,
      });
      // console.json({updateSessionRes});

      // console.debug({
      //   userId: mUser.id,
      //   deviceId: updateSessionRes.deviceId,
      //   fcmPushToken: `${updateSessionRes.fcmPushToken.substr(0, 12)}...`,
      // });

      if( !App.isObject(updateSessionRes) || !App.isPosNumber(updateSessionRes.id) )
        return App.json( res, false, App.t(['failed-to','update','fcm','push','token'], res.lang));

      App.json( res, true, App.t(['success'], res.lang));

    }catch(e){
      console.log(e);
      App.onRouteError( req, res, e );
      // App.json( res, false, App.t('request-could-not-be-processed', req.lang) );
    }

  });

  return { router, method: '', autoDoc:{} };

};


