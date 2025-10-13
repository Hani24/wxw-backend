const express = require('express');
const router = express.Router();

module.exports = function(App, RPath){

  router.use('', async(req, res)=>{

    try{

      const mUser = await req.user;
      const mDeliveryPriceSettings = await App.getModel('DeliveryPriceSettings').getSettings();

      if( !App.isObject(mDeliveryPriceSettings) || !App.isPosNumber(mDeliveryPriceSettings.id) )
        return App.json( res, 417, App.t(['could-not','get','delivery','price','settings'], res.lang), );

      App.json( res, true, App.t(['success'], res.lang), mDeliveryPriceSettings );

    }catch(e){
      console.log(e);
      App.onRouteError( req, res, e );
      // App.json( res, false, App.t('request-could-not-be-processed', req.lang) );
    }

  });

  return { router, method: 'post', autoDoc:{} };

};


