const express = require('express');
const router = express.Router();

// /private/restaurant/kyc/get/status/

module.exports = function(App, RPath){

  router.use('', async(req, res)=>{

    try{

      const data = req.getPost();
      const mUser = await req.user;
      const mRestaurant = await req.restaurant;

      await App.json( res, true, App.t(['success'],req.lang), {
        user: {
          isVerified: mUser.isVerified,
          isEmailVerified: mUser.isEmailVerified,
          isPhoneVerified: mUser.isPhoneVerified,
        },
        restaurant: {
          isVerified: mRestaurant.isVerified,
          isKycCompleted: mRestaurant.isKycCompleted,
          isOpeningHoursSet: mRestaurant.isOpeningHoursSet,
        },
      });

    }catch(e){
      console.log(e);
      App.onRouteError( req, res, e );
      // App.json( res, false, App.t('request-could-not-be-processed', req.lang) );
    }

  });

  return { router, method: '', autoDoc:{} };

};


