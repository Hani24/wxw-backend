const express = require('express');
const router = express.Router();

// /private/client/payment-cards/get/as/list

module.exports = function(App, RPath){

  router.use('', async(req, res)=>{

    try{

      const mUser = await req.user;
      const mClient = await req.client;
      const data = req.getPost();

      const list = await App.getModel('PaymentCard').getAllByClientId( mClient.id );
      // console.json({list});
      App.json( res, true, App.t('success', res.lang), list );

    }catch(e){
      console.log(e);
      App.onRouteError( req, res, e );
      // App.json( res, false, App.t('request-could-not-be-processed', req.lang) );
    }

  });

  return { router, method: '', autoDoc:{} };

};


