const express = require('express');
const router = express.Router();

// /private/client/cart/get/

module.exports = function(App, RPath){

  router.use('', async(req, res)=>{

    try{

      const data = req.getPost();
      const mUser = await req.user;
      const mClient = await req.client;

      const mDeliveryPriceSettings = await App.getModel('DeliveryPriceSettings').getSettings();
      if( !App.isObject(mDeliveryPriceSettings) || !App.isPosNumber(mDeliveryPriceSettings.id) )
        return App.json( res, 417, App.t(['failed-to','get','system','settings'], req.lang) );

      const mRestaurants = await App.getModel('Cart').getPopulatedByClientId( mClient.id );

      if( !App.isArray(mRestaurants) || !mRestaurants.length )
        return App.json( res, true, App.t('success', res.lang), []);

      const calcOptimalDistanceRes = await App.getModel('DeliveryPriceSettings')
        .calcOptimalDistance( mUser, /*mClient,*/ mRestaurants, mDeliveryPriceSettings, {useGoogle:false} );

      if( !calcOptimalDistanceRes.success ){
        console.json({calcOptimalDistanceRes});
        return App.json( res, false, App.t(calcOptimalDistanceRes.message, res.lang), []);
      }

      const deliveryPrice = calcOptimalDistanceRes.data.deliveryPrice;
      let totalPrice = 0;
      let finalPrice = 0;
let totalItemCount = 0;
      for( const mRestaurant of mRestaurants ){
        if( App.isObject(mRestaurant) && App.isPosNumber(mRestaurant.id) ){
          // mRestaurant.image = App.S3.getUrlByName(mRestaurant.image);

          if( App.isArray(mRestaurant.CartItems) && mRestaurant.CartItems.length ){
            for( const mCartItem of mRestaurant.CartItems ){
              mCartItem.dataValues.totalPrice = +( mCartItem.amount * mCartItem.MenuItem.price ).toFixed(2);
              // mCartItem.dataValues.MenuItem.image = App.S3.getUrlByName(mCartItem.MenuItem.image);
              totalPrice += mCartItem.dataValues.totalPrice;
		    totalItemCount += mCartItem.amount;
            }
          }
        }
      }

      finalPrice = App.getNumber(totalPrice + deliveryPrice, {toFixed: 2} );

      App.json( res, true, App.t('success', res.lang), {
        suppliers: mRestaurants,
        totalPrice,
        finalPrice,
        deliveryPrice,
	      totalItemCount,
      });

    }catch(e){
      console.log(e);
      App.onRouteError( req, res, e );
      // App.json( res, false, App.t('request-could-not-be-processed', req.lang) );
    }

  });

  return { router, method: '', autoDoc:{} };

};


