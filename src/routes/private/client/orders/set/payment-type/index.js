const express = require('express');
const router = express.Router();

// {
//   "// NOTE:": "all payment-types are available as Array: [<string>] /public/system/payment-types/get/all",
//   "id": "required: <number>: Ref. Order.id",
//   "type": "required: ENUM: <string> [ ApplePay | GooglePay | Card ]",
//   "paymentCardId": "optional: (if type == Card) <number> Ref. PaymentCard.id"
// }

// {
//   "id": 10000000004,
//   "type": "Card",
//   "paymentCardId": 3
// }

// /private/client/orders/set/payment-type

module.exports = function(App, RPath){

  router.use('', async(req, res)=>{

    try{

      const data = req.getPost();

      const mUser = await req.user;
      const mClient = await req.client;

      const id = req.getCommonDataInt('id', null);
      const paymentCardId = req.getCommonDataInt('paymentCardId', null);
      const type = req.getCommonDataString('type', null);
      const paymentTypes = App.getModel('OrderPaymentType').getTypes();
 
      if( App.isNull(id) )
        return App.json( res, 417, App.t(['order','id','is-required'], req.lang) );

      const mOrder = await App.getModel('Order').getByFields({
        id,
        clientId: mClient.id,
        // include: [{
        //   model: App.getModel('OrderPaymentType'),
        //   include: [{
        //     model: App.getModel('PaymentCard'),
        //   }]
        // }]
      });

      if( !App.isObject(mOrder) || !App.isPosNumber(mOrder.id) )
        return App.json( res, 404, App.t(['order','not','found'], req.lang) );

      if( mOrder.status !== App.getModel('Order').getStatuses().created )
        return App.json( res, 417, App.t(['current','order','cannot-be','updated'], req.lang) );

      if( App.isNull(type) || !App.getModel('OrderPaymentType').isValidType( type ) )
        return App.json( res, 417, App.t(['payment','type','is-not','supported'], req.lang), paymentTypes );

      let mPaymentCard = null;

      if( type === paymentTypes.Card ){

        if( App.isNull(paymentCardId) )
          return App.json( res, 417, App.t(['payment','card','is-required'], req.lang) );

        mPaymentCard = await App.getModel('PaymentCard').findOne({
          where: {
            id: paymentCardId,
            clientId: mClient.id,
          }
        });

        if( !App.isObject(mPaymentCard) || !App.isPosNumber(mPaymentCard.id) )
          return App.json( res, 404, App.t(['payment','card','not','found'], req.lang) );

      }

      let mOrderPaymentType = await App.getModel('OrderPaymentType').findOne({
        where: {
          orderId: mOrder.id,
        }
      });

      if( !App.isObject(mOrderPaymentType) || !App.isPosNumber(mOrderPaymentType.id) ){

        mOrderPaymentType = await App.getModel('OrderPaymentType').create({
          orderId: mOrder.id,
        });

        if( !App.isObject(mOrderPaymentType) || !App.isPosNumber(mOrderPaymentType.id) )
          return App.json( res, false, App.t(['failed-to','create','order','payment','type'], req.lang) );
      }

      const updateRes = await mOrderPaymentType.update({
        type: type,
        paymentCardId: (App.isObject(mPaymentCard) ? mPaymentCard.id : null),
      });

      if( !App.isObject(updateRes) || !App.isPosNumber(updateRes.id) )
        return App.json( res, false, App.t(['failed-to','set','order','payment','type'], req.lang) );

      App.json( res, true, App.t('success', res.lang), updateRes );

    }catch(e){
      console.log(e);
      App.onRouteError( req, res, e );
      // App.json( res, false, App.t('request-could-not-be-processed', req.lang) );
    }

  });

  return { router, method: '', autoDoc:{} };

};


