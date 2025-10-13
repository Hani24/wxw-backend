const express = require('express');
const router = express.Router();

// {
//   "id": "required: <number>: Ref. Order.id",
//   "deliveryAddressId": "required: <number> Ref. DeliveryAddress.id"
// }

// {
//   "id": 10000000004,
//   "deliveryAddressId": 10
// }

// /private/client/orders/set/delivery-address

module.exports = function(App, RPath){

  router.use('', async(req, res)=>{

    try{

      const data = req.getPost();

      const mUser = await req.user;
      const mClient = await req.client;

      const id = req.getCommonDataInt('id', null);
      const deliveryAddressId = req.getCommonDataInt('deliveryAddressId', null);

      if( App.isNull(id) )
        return App.json( res, 417, App.t(['order','id','is-required'], req.lang) );

      if( App.isNull(deliveryAddressId) )
        return App.json( res, 417, App.t(['delivery-address','id','is-required'], req.lang) );

      const mDeliveryAddress = await App.getModel('DeliveryAddress').getByFields({
        id: deliveryAddressId,
        clientId: mClient.id,
      });

      if( !App.isObject(mDeliveryAddress) || !App.isPosNumber(mDeliveryAddress.id) )
        return App.json( res, 404, App.t(['delivery-address','not','found'], req.lang) );

      let mOrder = await App.getModel('Order').getByFields({
        id,
        clientId: mClient.id,
        // include: [{
        //   model: App.getModel('OrderDeliveryAddress'),
        //   include: [{
        //     model: App.getModel('DeliveryAddress'),
        //   }]
        // }]
      });

      if( !App.isObject(mOrder) || !App.isPosNumber(mOrder.id) )
        return App.json( res, 404, App.t(['order','not','found'], req.lang) );

      if( mOrder.status !== App.getModel('Order').getStatuses().created )
        return App.json( res, 417, App.t(['current','order','cannot-be','updated'], req.lang) );

      let mOrderDeliveryAddress = await App.getModel('OrderDeliveryAddress').findOne({
        where: {
          orderId: mOrder.id
        },
      });

      if( !App.isObject(mOrderDeliveryAddress) || !App.isPosNumber(mOrderDeliveryAddress.id) ){
        mOrderDeliveryAddress = await App.getModel('OrderDeliveryAddress').create({
          orderId: mOrder.id
        });

        if( !App.isObject(mOrderDeliveryAddress) || !App.isPosNumber(mOrderDeliveryAddress.id) )
          return App.json( res, false, App.t(['failed-to','create','order','delivery-address'], req.lang) );

      }

      // break; it is the same address as before
      // if( mOrderDeliveryAddress.deliveryAddressId === deliveryAddressId  )
      //   return App.json( res, true, App.t(['success'], req.lang) );

      const updateRes = await mOrderDeliveryAddress.update({
        deliveryAddressId
      });

      if( !App.isObject(updateRes) || !App.isPosNumber(updateRes.id) )
        return App.json( res, false, App.t(['failed-to','set','order','delivery-address'], req.lang) );

      const mDeliveryPriceSettings = await App.getModel('DeliveryPriceSettings').getSettings();
      if( !App.isObject(mDeliveryPriceSettings) || !App.isPosNumber(mDeliveryPriceSettings.id) )
        return App.json( res, 417, App.t(['failed-to','get','system','settings'], req.lang) );

      let highestOrderPrepTimeInSeconds = 0;
      const mRestaurants = await App.getModel('Cart').getPopulatedByClientId( mClient.id );

      for( const mRestaurant of mRestaurants ){
        highestOrderPrepTimeInSeconds = (mRestaurant.orderPrepTime*60) > highestOrderPrepTimeInSeconds
          ? (mRestaurant.orderPrepTime*60)
          : highestOrderPrepTimeInSeconds;
      }

      const calcOptimalDistanceRes = await App.getModel('DeliveryPriceSettings')
        .calcOptimalDistance( mDeliveryAddress, mRestaurants, mDeliveryPriceSettings, {useGoogle:true} );

      if( !calcOptimalDistanceRes.success ){
        console.json({calcOptimalDistanceRes});
        return App.json( res, false, App.t(calcOptimalDistanceRes.message, res.lang), []);
      }

      const finalOrderPriceRes = await App.getModel('DeliveryPriceSettings').calculateFinalOrderPrice(
        calcOptimalDistanceRes, mDeliveryPriceSettings, mOrder, highestOrderPrepTimeInSeconds
      );

      if( !finalOrderPriceRes.success ){
        console.json({finalOrderPriceRes});
        return App.json( res, false, App.t(finalOrderPriceRes.message, res.lang), []);
      }

      mOrder = await mOrder.update(finalOrderPriceRes.data);
      mOrder = await mOrder.update({checksum: true});

      if( !App.isObject(mOrder) || !App.isPosNumber(mOrder.id) )
        return App.json( res, 417, App.t(['failed-to','update','order','details'], req.lang) );

      console.json({setDeliveryAddress: mOrder});
      App.json( res, true, App.t('success', res.lang), mOrder );

    }catch(e){
      console.log(e);
      App.onRouteError( req, res, e );
      // App.json( res, false, App.t('request-could-not-be-processed', req.lang) );
    }

  });

  return { router, method: '', autoDoc:{} };

};


