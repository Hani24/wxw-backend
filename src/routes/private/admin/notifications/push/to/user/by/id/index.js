"use strict"

const express = require('express');
const router = express.Router();

// {
//   "id": "required: <number> Ref. User.id",
//   "title": "required: <string> Notifications title",
//   "message": "required: <string> Notifications message"
// }

// {
//   "id": "6",
//   "title": "Hello user ID 6",
//   "message": "this is personal p2p message"
// }

// /private/admin/notifications/push/to/user/by/id/

module.exports = function(App, RPath){

  router.use('', async(req, res, next)=>{

    try{

      const data = req.getPost();
      const userId = req.getCommonDataInt('id', null);
      // console.log({ userId });

      if( App.isNull(userId) )
        return App.json(res, 417, App.t(['[id]','is-required'], req.lang) );

      if( !(await App.getModel('User').isset({ id: userId })) )
        return App.json(res, 404, App.t(['user','id','not','found'], req.lang) );

      // TODO: Fix it with AWS-S3
      // const icon = 'notifications.default.png'; //App.getUrlOrCreateByPath('icon.default.png', 'notificationsImagesRoot');
      const icon = App.S3.getUrlByName('notifications.default.png');

      const notification_t = {
        title: App.isString(data.title) && data.title.trim().length ? data.title : App.getAppName(),
        message: App.isString(data.message) && data.message.trim().length ? data.message.trim() : false,
        icon,
        data: {
          type: 'p2p',
          id: 0,
        }
      };
      // console.json({ userId, notification_t });

      if( !notification_t.message )
        return App.json(res, 417, App.t(['notification','message','is-required'],req.lang));

      const awaitResult = true;

      if( awaitResult ){
        const pushRes = await App.Push.fcm.sendToUserByIdAsync( userId, notification_t );
        return App.json( res, 417, App.t( pushRes.message, req.lang) );
      }

      await App.json( res, true, App.t(['notification','created','successfully'], req.lang) );

      // [post-processing]
      // App.Push.fcm.sendToUserByIdInBackground( userId, notification_t );
      await App.Push.fcm.sendToUserByIdAsync( userId, notification_t );
      // console.json({ pushRes: await App.Push.fcm.sendToUserByIdAsync( userId, notification_t ) });

    }catch(e){
      console.log(e);
      // App.onRouteError( req, res, e );
      // App.json( res, false, App.t('request-could-not-be-processed', req.lang) );
    }

  });

  return { router, method: 'post', autoDoc:{} };

};

