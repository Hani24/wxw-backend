const express = require('express');
const router = express.Router();

// {
//   "// NOTE:": "types are available at: /public/system/payment-types/get/all",
//   "type": "required: ENUM: <string> [ ApplePay | GooglePay | Card ]",
//   "paymentCardId": "optional: (if type == Card) <number> Ref. PaymentCard.id"
// }

// {
//   "type": "Card",
//   "paymentCardId": 3
// }

// /private/client/payment-settings/update

module.exports = function(App, RPath){

  router.use('', async(req, res)=>{

    try{

      const data = req.getPost();

      const mUser = await req.user;
      const mClient = await req.client;

      const paymentCardId = req.getCommonDataInt('paymentCardId', null);
      const type = req.getCommonDataString('type', null);
      const paymentTypes = App.getModel('OrderPaymentType').getTypes();

      // console.json({ paymentCardId, type });
      // console.debug({ paymentTypes });

      // Auto-creates ClientPaymentSettings if it doesn't exist
      // Note: payment-settings/get handles platform detection on first call
      let mClientPaymentSettings = await App.getModel('ClientPaymentSettings')
        .getByClientId(mClient.id);

      // This should never happen as getByClientId auto-creates, but handle gracefully
      if( !App.isObject(mClientPaymentSettings) || !App.isPosNumber(mClientPaymentSettings.id) ){
        return App.json( res, 500, App.t(['failed', 'to', 'get', 'payment-settings'], req.lang) );
      }


      if( !App.getModel('OrderPaymentType').isValidType( type ) )
        return App.json( res, 417, App.t(['payment','type','is-not','supported'], req.lang), paymentTypes );

      let mPaymentCard = null;

      switch( type ){
        case paymentTypes.Card: {

          if( !App.isPosNumber(paymentCardId) )
            return App.json( res, 417, App.t(['payment','card','id','is-required'], req.lang) );

          mPaymentCard = await App.getModel('PaymentCard').findOne({
            where: {
              id: paymentCardId,
              clientId: mClient.id,
              isDeleted: false,
              isOneTimeCard: false,
            }
          });

          if( !App.isObject(mPaymentCard) || !App.isPosNumber(mPaymentCard.id) )
            return App.json( res, 404, App.t(['payment','card','not','found'], req.lang) );

          await App.getModel('PaymentCard').update(
            { isDefault: false },
            { where: { clientId: mClient.id } }
          );

          const updatePaymentCard = await mPaymentCard.update({ isDefault: true });
          // console.json({paymentCardId, isDefault: updatePaymentCard.isDefault});
          break;
        }
        case paymentTypes.ApplePay: {

          break;
        }
        case paymentTypes.GooglePay: {

          break;
        }
      }

      const updateClientPaymentSettings = await mClientPaymentSettings.update({
        type: type,
        paymentCardId: (App.isObject(mPaymentCard) ? mPaymentCard.id : null),
      });
      // console.json({updateClientPaymentSettings});

      if( !App.isObject(updateClientPaymentSettings) || !App.isPosNumber(updateClientPaymentSettings.id) )
        return App.json( res, false, App.t(['failed-to','update','payment','settings'], req.lang) );

      App.json( res, true, App.t('success', res.lang), {
        type: updateClientPaymentSettings.type,
        paymentCardId: updateClientPaymentSettings.paymentCardId,
      });

    }catch(e){
      console.log(e);
      App.onRouteError( req, res, e );
      // App.json( res, false, App.t('request-could-not-be-processed', req.lang) );
    }

  });

  return { router, method: '', autoDoc:{} };

};


