const express = require('express');
const router = express.Router();

// /private/admin/delivery/price-settings/units/get/

module.exports = function(App, RPath){

  router.use('', async(req, res)=>{

    try{

      const mUser = await req.user;
      const units = await App.getModel('DeliveryPriceSettings').getUnits({asArray: true});

      App.json( res, true, App.t(['success'], res.lang), units );

    }catch(e){
      console.log(e);
      App.onRouteError( req, res, e );
      // App.json( res, false, App.t('request-could-not-be-processed', req.lang) );
    }

  });

  return { router, method: 'post', autoDoc:{} };

};


