const express = require('express');
const router = express.Router();

// /public/services/stripe/pub-key/get/

module.exports = function(App, RPath){

  router.use('', async(req, res)=>{

    try{

      const STRIPE_PUBLISHABLE_KEY = App.getEnv('STRIPE_PUBLISHABLE_KEY');

      App.json( res, true, App.t('success', req.lang), STRIPE_PUBLISHABLE_KEY );

    }catch(e){
      console.log(e);
      App.onRouteError( req, res, e );
      // App.json( res, false, App.t('request-could-not-be-processed', req.lang) );
    }

  });

  return { router, method: '', autoDoc:{} };

};


