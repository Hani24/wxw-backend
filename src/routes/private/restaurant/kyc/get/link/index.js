const express = require('express');
const router = express.Router();

// /private/restaurant/kyc/get/link/

module.exports = function(App, RPath){

  router.use('', async(req, res)=>{

    try{

      const data = req.getPost();
      const mUser = await req.user;
      const mRestaurant = await req.restaurant;

      if( !mUser.isEmailVerified )
        return App.json(res, 417, App.t(['email-address-verification-is-required'], req.lang));

      if( mUser.isVerified && mRestaurant.isKycCompleted )
        return App.json(res, 417, App.t(['account-is-already-verified'], req.lang));

      if( !mUser.isVerified && mRestaurant.isKycCompleted )
        return App.json(res, 417, App.t(['kyc-after-success...'], req.lang));

      const mKycLinkRes = await App.payments.stripe.getKYCAccountLink( mRestaurant.accountId );
      await App.json( res, mKycLinkRes );

    }catch(e){
      console.log(e);
      App.onRouteError( req, res, e );
      // App.json( res, false, App.t('request-could-not-be-processed', req.lang) );
    }

  });

  return { router, method: '', autoDoc:{} };

};


