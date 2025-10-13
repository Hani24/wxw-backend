const express = require('express');
const router = express.Router();

// {
//   "id": "required: <number>: Ref. Order.id",
//   "type": "required: ENUM: <string>: [ Conventional | Contactless ]"
// }

// {
//   "id": 10000000004,
//   "type": "Conventional | Contactless"
// }

// /private/client/orders/set/delivery-type

module.exports = function(App, RPath){

  router.use('', async(req, res)=>{

    try{

      const data = req.getPost();

      const mUser = await req.user;
      const mClient = await req.client;

      const id = req.getCommonDataInt('id', null);
      const type = req.getCommonDataString('type', null);
      const deliveryTypes = App.getModel('OrderDeliveryType').getTypes();

      if( App.isNull(id) )
        return App.json( res, 417, App.t(['order','id','is-required'], req.lang) );

      if( App.isNull(type) || !deliveryTypes.hasOwnProperty(type) )
        return App.json( res, 417, App.t(['order','delivery-type','is-required'], req.lang) );

      const mOrder = await App.getModel('Order').getByFields({
        id,
        clientId: mClient.id,
        // include: [{
        //   model: App.getModel('OrderDeliveryType'),
        // }]
      });

      if( !App.isObject(mOrder) || !App.isPosNumber(mOrder.id) )
        return App.json( res, 404, App.t(['order','not','found'], req.lang) );

      if( mOrder.status !== App.getModel('Order').getStatuses().created )
        return App.json( res, 417, App.t(['current','order','cannot-be','updated'], req.lang) );

      if( !(await App.getModel('OrderDeliveryType').isset({orderId: mOrder.id})) ){
        await App.getModel('OrderDeliveryType').create({
          orderId: mOrder.id,
          type: App.getModel('OrderDeliveryType').getTypes().Conventional
        }); 
      }

      const mOrderDeliveryType = await App.getModel('OrderDeliveryType').getByFields({
        orderId: mOrder.id,
      });

      if( !App.isObject(mOrderDeliveryType) || !App.isPosNumber(mOrderDeliveryType.id) )
        return App.json( res, 404, App.t(['order','delivery-type','not','found'], req.lang) );

      const updateRes = await mOrderDeliveryType.update({
        type
      });

      if( !App.isObject(updateRes) || !App.isPosNumber(updateRes.id) )
        return App.json( res, false, App.t(['failed-to','set','order','delivery-type'], req.lang) );

      App.json( res, true, App.t('success', res.lang), updateRes );

    }catch(e){
      console.log(e);
      App.onRouteError( req, res, e );
      // App.json( res, false, App.t('request-could-not-be-processed', req.lang) );
    }

  });

  return { router, method: '', autoDoc:{} };

};


