const express = require('express');
const router = express.Router();

// {
//   "id": "required: <number>: Ref. DiscountCode.id"
// }

// /private/admin/discount-codes/delete/by/id/:id

module.exports = function(App, RPath){

  router.use('', async(req, res)=>{

    try{

      const mUser = await req.user;
      // const mRestaurant = await req.restaurant;
      const id = App.getPosNumber(req.getCommonDataInt('id', null));

     if( App.isNull(id) )
        return App.json( res, 417, App.t(['Discount','code','id','is-required'], req.lang) );

      const mDiscountCode = await App.getModel('DiscountCode').findOne({
        where: {
          id,
          isDeleted: false,
        },
      });

      if( !App.isObject(mDiscountCode) || !App.isPosNumber(mDiscountCode.id) )
        return App.json( res, 404, App.t(['Discount','code','not-found'], req.lang) );

      await mDiscountCode.update({ isDeleted: true, isActive: false });

      App.json( res, true, App.t('success', res.lang), mDiscountCode);

    }catch(e){
      console.log(e);
      App.onRouteError( req, res, e );
      // App.json( res, false, App.t('request-could-not-be-processed', req.lang) );
    }

  });

  return { router, method: '', autoDoc:{} };

};
