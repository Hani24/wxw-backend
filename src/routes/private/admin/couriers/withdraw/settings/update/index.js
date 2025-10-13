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

// /private/admin/couriers/withdraw/settings/get/

module.exports = function(App, RPath){

  router.use('', async(req, res)=>{

    try{

      const data = req.getPost();
      const mUser = await req.user;
      const mCourierWithdrawSettings = await App.getModel('CourierWithdrawSettings').getSettings();
      if( !App.isObject(mCourierWithdrawSettings) || !App.isPosNumber(mCourierWithdrawSettings.id) )
        return App.json( res, 417, App.t(['could-not','get','courier','withdraw','settings'], res.lang), );

      const courierWithdrawSettings_t = {
        isEnabled: App.getBoolFromValue(data.isEnabled),
        minAmount: App.getNumber(req.getCommonDataFloat('minAmount', 0), {floor: true, abs: true}),
        maxAmount: App.getNumber(req.getCommonDataFloat('maxAmount', 0), {floor: true, abs: true}),
      };

      if( courierWithdrawSettings_t.maxAmount < courierWithdrawSettings_t.minAmount )
        return App.json( res, 417, App.t(['max. amount cannot be greater than min. amount'], res.lang), );

      const updateCourierWithdrawSettings = await mCourierWithdrawSettings.update(courierWithdrawSettings_t);
      if( !App.isObject(updateCourierWithdrawSettings) || !App.isPosNumber(updateCourierWithdrawSettings.id) )
        return App.json( res, 417, App.t(['Failed to update settings'], res.lang), );

      App.json( res, true, App.t(['success'], res.lang), updateCourierWithdrawSettings );

    }catch(e){
      console.log(e);
      App.onRouteError( req, res, e );
      // App.json( res, false, App.t('request-could-not-be-processed', req.lang) );
    }

  });

  return { router, method: 'post', autoDoc:{} };

};


