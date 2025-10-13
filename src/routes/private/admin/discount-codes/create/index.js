const express = require('express');
const router = express.Router();

// {
//   "isActive": "required: <boolean>: to temporary deactivate",
//   "code": "required: <string>",
//   "// NOTE": "menu-discount: is in percent of total-price: delivery-price not included",
//   "// NOTE": "use: /private/admin/discount-codes/settings/max-discount-percent/get/ to get max percent limit",
//   "type": "required: ENUM: <string>: [ free-delivery, menu-discount ]",
//   "discount": "required: <number>: required if type == 'menu-discount'",
//   "description": "optional: <string>"
// }

// "expiresAt": "not in use: <iso-datetime>"

// {
//   "isActive": false,
//   "code": "SUPER7",
//   "type": "menu-discount",
//   "discount": 12.45,
//   "description": "Super - 7 discount descr..."
// }

// /private/admin/discount-codes/create

module.exports = function(App, RPath){

  router.use('', async(req, res)=>{

    try{

      const data = req.getPost();
      const mUser = await req.user;
      const types = App.getModel('DiscountCode').getTypes();

      const discount_t = {
        isActive: App.getBoolFromValue(data.isActive),
        code: req.getCommonDataString('code', null),
        type: req.getCommonDataString('type', null),
        discount: App.getPosNumber(req.getCommonDataFloat('discount', 0), {floor: false, toFixed: 2, abs: true}),
        description: req.getCommonDataString('description', '').substr(0,255),
        // expiresAt: req.getCommonDataString('type', null),
      };

      if( !App.isString(discount_t.code) || discount_t.code.length <= 1 )
        return App.json( res, 417, App.t(['Discount-code','code','is-required'], req.lang) );

      if( !types.hasOwnProperty(discount_t.type) )
        return App.json( res, 417, App.t(['Unsupported','discount','type'], req.lang), {types} );

      if( discount_t.type === types['menu-discount']){
        const mDiscountSettings = await App.getModel('DiscountSettings').getSettings();
        if( discount_t.discount === 0 || discount_t.discount > mDiscountSettings.maxDiscountPercent )
          return App.json( res, 417, App.t([
            'Discount','type', discount_t.type, 'cannot be zero and must be less than',mDiscountSettings.maxDiscountPercent,'%'
          ], req.lang) );
      }

      if( discount_t.type === types['free-delivery'] )
        discount_t.discount = 0;

      const mDiscountCode = await App.getModel('DiscountCode').create( discount_t );
      if( !App.isObject(mDiscountCode) || !App.isPosNumber(mDiscountCode.id) )
        return App.json( res, 404, App.t(['Discount','code','not-found'], req.lang) );

      App.json( res, true, App.t('success', res.lang), mDiscountCode);

    }catch(e){
      console.log(e);
      App.onRouteError( req, res, e );
      // App.json( res, false, App.t('request-could-not-be-processed', req.lang) );
    }

  });

  return { router, method: '', autoDoc:{} };

};
