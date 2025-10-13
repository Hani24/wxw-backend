const express = require('express');
const router = express.Router();

// /private/courier/profile/get/

module.exports = function(App, RPath){

  router.use('', async(req, res)=>{

    try{

      const data = req.getPost();
      const mUser = await req.user;
      const mCourier = await req.courier;

      const data_t = {
        user: await App.getModel('User').getCommonDataFromObject( mUser ),
        courier: await App.getModel('Courier').getCommonDataFromObject( mCourier ),
      };

      // console.json({ data_t });
      App.json( res, true, App.t('success', res.lang), data_t );

    }catch(e){
      console.log(e);
      App.onRouteError( req, res, e );
      // App.json( res, false, App.t('request-could-not-be-processed', req.lang) );
    }

  });

  return { router, method: '', autoDoc:{} };

};


