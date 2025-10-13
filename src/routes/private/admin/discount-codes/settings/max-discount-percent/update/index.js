const express = require('express');
const router = express.Router();

// {
//   "isEnabled": "required: <boolean>",
//   "maxDiscountPercent": "required: <float>"
// }

// {
//   "isEnabled": false,
//   "maxDiscountPercent": 99.99999999
// }

// /private/admin/discount-codes/settings/max-discount-percent/update

module.exports = function(App, RPath){

  router.use('', async(req, res)=>{

    try{

      const data = req.getPost();
      const mUser = await req.user;

      const mDiscountSettings = await App.getModel('DiscountSettings').getSettings();
      if( !App.isObject(mDiscountSettings) || !App.isPosNumber(mDiscountSettings.id) )
        return App.json( res, 404, App.t(['Discount','code','not-found'], req.lang) );

      const discount_t = {
        isEnabled: App.getBoolFromValue(data.isEnabled),
        maxDiscountPercent: App.getPosNumber(req.getCommonDataFloat('maxDiscountPercent', 0), {floor: false, toFixed: 2, abs: true})
      };

      const updateDiscountSettings = await mDiscountSettings.update(discount_t);
      if( !App.isObject(updateDiscountSettings) || !App.isPosNumber(updateDiscountSettings.id) )
        return App.json( res, false, App.t(['Failed to update Discountcode'], req.lang) );

      await App.json( res, true, App.t('success', res.lang), updateDiscountSettings);

    }catch(e){
      console.log(e);
      App.onRouteError( req, res, e );
      // App.json( res, false, App.t('request-could-not-be-processed', req.lang) );
    }

  });

  return { router, method: '', autoDoc:{} };

};
