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

      // For guests or users without delivery address, use default delivery address or skip calculation
      let mEndPoint = mUser;
      const mDeliveryAddress = await App.getModel('DeliveryAddress').getDefaultByClientId(mClient.id);

      if (App.isObject(mDeliveryAddress) && App.isPosNumber(mDeliveryAddress.id)) {
        mEndPoint = mDeliveryAddress;
      } else if (req.isGuest || !App.isPosNumber(mUser.lat) || !App.isPosNumber(mUser.lon)) {
        // Guest user or user without location - use IP-based location or default to 0
        if (res.info.lat && res.info.lon) {
          mEndPoint = {
            id: mUser.id,
            lat: res.info.lat,
            lon: res.info.lon,
          };
        } else {
          // No location available - return cart with estimated delivery price
          let totalPrice = 0;
          let totalItemCount = 0;

          for (const mRestaurant of mRestaurants) {
            if (App.isObject(mRestaurant) && App.isPosNumber(mRestaurant.id)) {
              if (App.isArray(mRestaurant.CartItems) && mRestaurant.CartItems.length) {
                for (const mCartItem of mRestaurant.CartItems) {
                  mCartItem.dataValues.totalPrice = +(mCartItem.amount * mCartItem.MenuItem.price).toFixed(2);
                  totalPrice += mCartItem.dataValues.totalPrice;
                  totalItemCount += mCartItem.amount;
                }
              }
            }
          }

          // Return with estimated/default delivery price
          const estimatedDeliveryPrice = mDeliveryPriceSettings.baseFee || 5.0;
          const finalPrice = App.getNumber(totalPrice + estimatedDeliveryPrice, {toFixed: 2});

          return App.json(res, true, App.t('success', res.lang), {
            suppliers: mRestaurants,
            totalPrice,
            finalPrice,
            deliveryPrice: estimatedDeliveryPrice,
            totalItemCount,
            isEstimated: true, // Flag to indicate delivery price is estimated
          });
        }
      }

      const calcOptimalDistanceRes = await App.getModel('DeliveryPriceSettings')
        .calcOptimalDistance(mEndPoint, mRestaurants, mDeliveryPriceSettings, {useGoogle: false});

      if (!calcOptimalDistanceRes.success) {
        console.json({calcOptimalDistanceRes});
        // Don't fail - return with estimated delivery price
        let totalPrice = 0;
        let totalItemCount = 0;

        for (const mRestaurant of mRestaurants) {
          if (App.isObject(mRestaurant) && App.isPosNumber(mRestaurant.id)) {
            if (App.isArray(mRestaurant.CartItems) && mRestaurant.CartItems.length) {
              for (const mCartItem of mRestaurant.CartItems) {
                mCartItem.dataValues.totalPrice = +(mCartItem.amount * mCartItem.MenuItem.price).toFixed(2);
                totalPrice += mCartItem.dataValues.totalPrice;
                totalItemCount += mCartItem.amount;
              }
            }
          }
        }

        const estimatedDeliveryPrice = mDeliveryPriceSettings.baseFee || 5.0;
        const finalPrice = App.getNumber(totalPrice + estimatedDeliveryPrice, {toFixed: 2});

        return App.json(res, true, App.t('success', res.lang), {
          suppliers: mRestaurants,
          totalPrice,
          finalPrice,
          deliveryPrice: estimatedDeliveryPrice,
          totalItemCount,
          isEstimated: true,
        });
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


