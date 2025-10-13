const express = require('express');
const router = express.Router();

// /private/admin/discount-codes/settings/max-discount-percent/get

module.exports = function(App, RPath){

  router.use('', async(req, res)=>{

    try{

      const data = req.getPost();
      const mUser = await req.user;

      const mDiscountSettings = await App.getModel('DiscountSettings').getSettings();
      if( !App.isObject(mDiscountSettings) || !App.isPosNumber(mDiscountSettings.id) )
        return App.json( res, 404, App.t(['Discount','code','not-found'], req.lang) );

      App.json( res, true, App.t('success', res.lang), mDiscountSettings);

    }catch(e){
      console.log(e);
      App.onRouteError( req, res, e );
      // App.json( res, false, App.t('request-could-not-be-processed', req.lang) );
    }

  });

  return { router, method: '', autoDoc:{} };

};
