const express = require('express');
const router = express.Router();

// /private/client/notifications/get-push-test/

module.exports = function(App, RPath){

  router.use('', async(req, res)=>{

    try{

      if( App.isEnv('dev') )
        return App.json( res, true, App.t('break', req.lang) );

      const mUser = await req.user;
      const mClient = await req.client;
      const data = req.getPost();

      const pushRes = await App.getModel('ClientNotification')
        .pushToClient( mClient, {
          title: `Test: date: ${App.getISODate()}`, 
          message: `uid: ${mUser.id}, cid: ${mClient.id}`,
          // image: false,
          data: {
            userId: mUser.id,
            clientId: mClient.id,
          }
        }, false );
      // console.json({mClient, mUser, pushRes});
      App.json( res, pushRes );

    }catch(e){
      console.log(e);
      App.onRouteError( req, res, e );
      // App.json( res, false, App.t('request-could-not-be-processed', req.lang) );
    }

  });

  return { router, method: '', autoDoc:{} };

};


