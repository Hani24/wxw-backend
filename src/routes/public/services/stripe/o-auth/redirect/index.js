const express = require('express');
const router = express.Router();
const Stripe = require('stripe');

// /public/services/stripe/web-hook/o-auth/redirect

module.exports = function(App, RPath){

  router.use('', /* express.raw({type: 'application/json'}), */ async(req, res)=>{

    try{

      const data = req.getPost();
      App.json( res, true, App.t(['o-auth','success'], req.lang) );

    }catch(e){
      console.log(e);
      App.onRouteError( req, res, e );
      // App.json( res, false, App.t('request-could-not-be-processed', req.lang) );
    }

  });

  return { router, method: '', autoDoc:{} };

};


