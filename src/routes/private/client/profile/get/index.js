const express = require('express');
const router = express.Router();

// /private/client/profile/get/

module.exports = function(App, RPath){

  router.use('', async(req, res)=>{

    try{

      const data = req.getPost();
      const mUser = await req.user;
      const mClient = await req.client;

      const data_t = {
        user: await App.getModel('User').getCommonDataFromObject( mUser ),
        client: await App.getModel('Client').getCommonDataFromObject( mClient ),
      };

      // console.json({ 
      //   user: {
      //     birthday: data_t.user.birthday,
      //     birthdayIso: data_t.user.birthdayIso,
      //   }
      // });
      App.json( res, true, App.t('success', res.lang), data_t );

    }catch(e){
      console.log(e);
      App.onRouteError( req, res, e );
      // App.json( res, false, App.t('request-could-not-be-processed', req.lang) );
    }

  });

  return { router, method: '', autoDoc:{} };

};


