const express = require('express');
const router = express.Router();

// /public/system/delivery-types/get/all

module.exports = function(App, RPath){

  router.use('', async(req, res)=>{

    try{
      const data_t = App.getModel('OrderDeliveryType').getTypes({asArray: true});
      App.json( res, true, App.t(['success'], res.lang), data_t );

    }catch(e){
      console.log(e);
      App.onRouteError( req, res, e );
      // App.json( res, false, App.t('request-could-not-be-processed', req.lang) );
    }

  });

  return { router, method: '', autoDoc:{} };

};


