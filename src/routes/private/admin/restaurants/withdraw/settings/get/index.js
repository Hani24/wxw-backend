const express = require('express');
const router = express.Router();

// /private/admin/restaurants/withdraw/settings/get/

module.exports = function(App, RPath){

  router.use('', async(req, res)=>{

    try{

      const mUser = await req.user;
      const mRestaurantWithdrawSettings = await App.getModel('RestaurantWithdrawSettings').getSettings();

      if( !App.isObject(mRestaurantWithdrawSettings) || !App.isPosNumber(mRestaurantWithdrawSettings.id) )
        return App.json( res, 417, App.t(['could-not','get','restaurant','withdraw','settings'], res.lang), );

      App.json( res, true, App.t(['success'], res.lang), mRestaurantWithdrawSettings );

    }catch(e){
      console.log(e);
      App.onRouteError( req, res, e );
      // App.json( res, false, App.t('request-could-not-be-processed', req.lang) );
    }

  });

  return { router, method: 'post', autoDoc:{} };

};


