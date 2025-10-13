const express = require('express');
const router = express.Router();

// {
//   "code": "required: <string>"
// }

// /private/client/discount-code/get/discount/by/code/

module.exports = function(App, RPath){

  router.use('', async(req, res)=>{

    try{

      const data = req.getPost();
      const mUser = await req.user;
      const mClient = await req.client;
      const code = req.getCommonDataString('code',null);

      await console.sleep(1500);

      if( App.isNull(code) )
        return App.json( res, 417, App.t(['discount','code','code','is-required'], req.lang) );

      const mDiscountSettings = await App.getModel('DiscountSettings').getSettings();
      if( !App.isObject(mDiscountSettings) || !App.isPosNumber(mDiscountSettings.id) )
        return App.json( res, false, App.t(['Failed to get discount settings.'], res.lang) );

      if( !mDiscountSettings.isEnabled )
        return App.json( res, 417, App.t(['All discounts are currently disabled.'], res.lang) );

      const isCartEmpty = await App.getModel('Cart').isCartEmptyByClientId( mClient.id );

      // do not show real value of the discount-code if user-cart is empty
      // his Cart has to be filled in to be able process the order and apply discount-code
      if( isCartEmpty )
        return App.json( res, 404, App.t(['Discount code not found'], req.lang) );

      const mDiscountCode = await App.getModel('DiscountCode').getActiveByCode( code ); // => .getByCode( code ); => can be inactive
      if( !App.isObject(mDiscountCode) || !App.isPosNumber(mDiscountCode.id) )
        return App.json( res, 404, App.t(['Discount code not found and/or has been expired'], req.lang) );

      const discountTypes = App.getModel('DiscountCode').getTypes({asArray: true});

      App.json( res, true, App.t('success', res.lang), {
        id: mDiscountCode.id,
        description: mDiscountCode.description,
        discount: +(mDiscountCode.discount).toFixed(2),
        type: mDiscountCode.type,
        types: discountTypes,
      });

    }catch(e){
      console.log(e);
      App.onRouteError( req, res, e );
      // App.json( res, false, App.t('request-could-not-be-processed', req.lang) );
    }

  });

  return { router, method: '', autoDoc:{} };

};


