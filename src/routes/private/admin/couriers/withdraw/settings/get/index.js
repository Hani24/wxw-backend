const express = require('express');
const router = express.Router();

// /private/admin/couriers/withdraw/settings/get/

module.exports = function(App, RPath){

  router.use('', async(req, res)=>{

    try{

      const mUser = await req.user;
      const mCourierWithdrawSettings = await App.getModel('CourierWithdrawSettings').getSettings();

      if( !App.isObject(mCourierWithdrawSettings) || !App.isPosNumber(mCourierWithdrawSettings.id) )
        return App.json( res, 417, App.t(['could-not','get','courier','withdraw','settings'], res.lang), );

      App.json( res, true, App.t(['success'], res.lang), mCourierWithdrawSettings );

    }catch(e){
      console.log(e);
      App.onRouteError( req, res, e );
      // App.json( res, false, App.t('request-could-not-be-processed', req.lang) );
    }

  });

  return { router, method: 'post', autoDoc:{} };

};


