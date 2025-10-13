"use strict"

const express = require('express');
const router = express.Router();

// {
//   "title": "required: <string> Notifications title",
//   "message": "required: <string> Notifications message"
// }

// {
//   "title": "Morris-Armstrong-II",
//   "message": "Checkout our new Super Menu"
// }

// /private/admin/notifications/push/broadcast/

module.exports = function(App, RPath){

  router.use('', async(req, res, next)=>{

    try{

      const data = req.getPost();
      const mUser = await req.user;
      const icon = App.S3.getUrlByName('notifications.default.png');

      const notification_t = {
        title: App.isString(data.title) && data.title.trim().length ? data.title : App.getAppName(),
        message: App.isString(data.message) && data.message.trim().length ? data.message.trim() :  false,
        icon,
        data: {
          type: 'broadcast',
          id: 0
        }
      };

      if( !notification_t.message )
        return App.json(res, 417, App.t(['message','is-required'],req.lang));

      await App.json( res, true, App.t(['created','successfully'], req.lang) );

      // [post-processing]
      // App.Push.fcm.broadcastInBackground( notification_t );
      const pushRes = await App.Push.fcm.broadcastAsync( notification_t /*, 'debug'*/ );

    }catch(e){
      console.log(e);
      // App.onRouteError( req, res, e );
      // App.json( res, false, App.t('request-could-not-be-processed', req.lang) );
    }

  });

  return { router, method: 'post', autoDoc:{} };

};

