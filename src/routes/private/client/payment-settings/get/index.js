const express = require('express');
const router = express.Router();

// /private/client/payment-settings/get

module.exports = function(App, RPath){

  router.use('', async(req, res)=>{

    try{

      const data = req.getPost();

      const mUser = await req.user;
      const mClient = await req.client;

      const mClientPaymentSettings = await App.getModel('ClientPaymentSettings')
        .getByClientId( mClient.id );

      if( !App.isObject(mClientPaymentSettings) || !App.isPosNumber(mClientPaymentSettings.id) )
        return App.json( res, 404, App.t(['payment-settings','not','found'], req.lang) );

      const paymentTypes = App.getModel('OrderPaymentType').getTypes({ asArray: true });
      // console.json({mClientPaymentSettings});

      App.json( res, true, App.t('success', res.lang), {
        type: mClientPaymentSettings.type,
        paymentCardId: (mClientPaymentSettings.paymentCardId || 0),
        paymentTypes,
      });

    }catch(e){
      console.log(e);
      App.onRouteError( req, res, e );
      // App.json( res, false, App.t('request-could-not-be-processed', req.lang) );
    }

  });

  return { router, method: '', autoDoc:{} };

};


