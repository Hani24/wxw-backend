const express = require('express');
const router = express.Router();

// /private/client/payment-settings/get

module.exports = function(App, RPath){

  router.use('', async(req, res)=>{

    try{

      const data = req.getPost();

      const mUser = await req.user;
      const mClient = await req.client;

      // Auto-creates ClientPaymentSettings if it doesn't exist
      let mClientPaymentSettings = await App.getModel('ClientPaymentSettings')
        .getByClientId( mClient.id );

      // This should never happen as getByClientId auto-creates, but handle gracefully
      if( !App.isObject(mClientPaymentSettings) || !App.isPosNumber(mClientPaymentSettings.id) ){
        // Fallback: try to create manually with a valid payment type
        const paymentTypes = App.getModel('OrderPaymentType').getTypes();

        // Detect platform from request headers or user agent
        const userAgent = (req.headers['user-agent'] || '').toLowerCase();
        const osVersion = req.getCommonDataString('osVersion', '').toLowerCase();
        const platform = req.getCommonDataString('platform', '').toLowerCase();

        // Determine best payment type based on platform
        let defaultType = paymentTypes.Card; // Fallback

        if(osVersion.includes('ios') || platform.includes('ios') || userAgent.includes('iphone') || userAgent.includes('ipad')){
          // iOS device - prefer ApplePay
          defaultType = paymentTypes.ApplePay;
        } else if(osVersion.includes('android') || platform.includes('android') || userAgent.includes('android')){
          // Android device - prefer GooglePay
          defaultType = paymentTypes.GooglePay;
        } else if(paymentTypes.ApplePay){
          // Unknown platform - default to ApplePay if available
          defaultType = paymentTypes.ApplePay;
        }

        try{
          const newSettings = await App.getModel('ClientPaymentSettings').create({
            clientId: mClient.id,
            type: defaultType // Use platform-specific payment type
          });
          if(!App.isObject(newSettings) || !App.isPosNumber(newSettings.id)){
            return App.json( res, 500, App.t(['failed', 'to', 'create', 'payment-settings'], req.lang) );
          }
          mClientPaymentSettings = newSettings;
        }catch(err){
          console.error('Error creating ClientPaymentSettings:', err);
          return App.json( res, 500, App.t(['failed', 'to', 'create', 'payment-settings'], req.lang) );
        }
      }

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


