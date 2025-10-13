const express = require('express');
const router = express.Router();

// {
//   "isEnabled": "required: <boolean>",
//   "minAmount": "required: <number>",
//   "maxAmount": "required: <number>"
// }

// {
//   "isEnabled": true,
//   "minAmount": 5,
//   "maxAmount": 0
// }

// /private/admin/restaurants/withdraw/settings/get/

module.exports = function(App, RPath){

  router.use('', async(req, res)=>{

    try{

      const data = req.getPost();
      const mUser = await req.user;
      const mRestaurantWithdrawSettings = await App.getModel('RestaurantWithdrawSettings').getSettings();
      if( !App.isObject(mRestaurantWithdrawSettings) || !App.isPosNumber(mRestaurantWithdrawSettings.id) )
        return App.json( res, 417, App.t(['could-not','get','restaurant','withdraw','settings'], res.lang), );

      const restaurantWithdrawSettings_t = {
        isEnabled: App.getBoolFromValue(data.isEnabled),
        minAmount: App.getNumber(req.getCommonDataFloat('minAmount', 0), {floor: true, abs: true}),
        maxAmount: App.getNumber(req.getCommonDataFloat('maxAmount', 0), {floor: true, abs: true}),
      };

      if( restaurantWithdrawSettings_t.maxAmount < restaurantWithdrawSettings_t.minAmount )
        return App.json( res, 417, App.t(['max. amount cannot be greater than min. amount'], res.lang), );

      const updateRestaurantWithdrawSettings = await mRestaurantWithdrawSettings.update(restaurantWithdrawSettings_t);
      if( !App.isObject(updateRestaurantWithdrawSettings) || !App.isPosNumber(updateRestaurantWithdrawSettings.id) )
        return App.json( res, 417, App.t(['Failed to update settings'], res.lang), );

      App.json( res, true, App.t(['success'], res.lang), updateRestaurantWithdrawSettings );

    }catch(e){
      console.log(e);
      App.onRouteError( req, res, e );
      // App.json( res, false, App.t('request-could-not-be-processed', req.lang) );
    }

  });

  return { router, method: 'post', autoDoc:{} };

};


