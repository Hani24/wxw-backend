const express = require('express');
const router = express.Router();

// {
//   "restaurantId": "required: <number> Ref. Restaurant.id"
// }

// {
//   "restaurantId": 2
// }

// /private/courier/restaurant/arrived/for/order/id/

module.exports = function(App, RPath){

  router.use('', async(req, res)=>{

    try{

      const data = req.getPost();
      const mUser = await req.user;
      const mCourier = await req.courier;

      const statuses = App.getModel('Order').getStatuses();

      // const id = req.getCommonDataInt('id', null);
      const restaurantId = req.getCommonDataInt('restaurantId', null);

      if( !App.isPosNumber(restaurantId) )
        return App.json( res, 417, App.t(['restaurant','id','is-required'], req.lang) );

      if( !mCourier.hasActiveOrder || !App.isPosNumber(mCourier.activeOrderId) )
        return App.json( res, 404, App.t(['you','do-not','have','active','order'], req.lang) );

      if( !(await App.getModel('Restaurant').isset({id: restaurantId})) )
        return App.json( res, 404, App.t(['restaurant','not-found'], req.lang));

      const mOrder = await App.getModel('Order').findOne({
        where: {
          id: mCourier.activeOrderId, // 10000000001
          status: statuses.processing, 
          // isCanceledByClient: false,
          // isRejectedByClient: false,
          // isPaid: true,
          // isRefunded: false,
          // isDeliveredByCourier: false,
        },
        attributes: [
          'id','status', // 'totalItems',
          'courierId',
          'clientId',
          'isCanceledByClient', // 'canceledByClientAt','cancellationReason',
          'isRejectedByClient', // 'rejectedByClientAt','rejectionReason',
          'isDeliveredByCourier', // 'deliveredByCourierAt',
          // 'isCourierRatedByClient', // 'courierRatedByClientAt','courierRating',
          'allSuppliersHaveConfirmed',
          'isPaid',
          'isRefunded',
        ],
        include: [
          {
            model: App.getModel('Client'),
            required: true,
            attributes: ['id','userId'],
            include: [{
              model: App.getModel('User'),
              attributes: ['id'],
            }]
          },
          {
            model: App.getModel('Courier'),
            required: true,
            attributes: ['id','userId']
          },
          {
            model: App.getModel('OrderSupplier'),
            required: true,
            where: {
              // restaurantId: mRestaurant.id,
              restaurantId: restaurantId,
              // isAcceptedByRestaurant: true,
              // isOrderReady: false, // Order can be "NOT-READY" yet @ this moment
              // isTakenByCourier: false,
              // isCourierArrived: false,
            },
            attributes: [
              'id','restaurantId',
              // 'totalPrice','totalItems',
              'isCanceledByRestaurant', // 'canceledByRestaurantAt', // 'cancellationReason',
              'isAcceptedByRestaurant', // 'acceptedByRestaurantAt',
              'isOrderReady', 'orderReadyAt',
              'isOrderDelayed','orderDelayedFor',
              'isTakenByCourier', 'takenByCourierAt',
              'isCourierArrived', 'courierArrivedAt',
            ],
          }
        ]
      });

      if( !App.isObject(mOrder) || !App.isPosNumber(mOrder.id) )
        return App.json( res, 404, App.t(['order','not-found','and','/','or','cannot-be','updated'], req.lang));

      if( mOrder.isDeliveredByCourier )
        return App.json( res, 417, App.t(['order','has-been','already','delivered'], req.lang) );

      if( mOrder.isCanceledByClient )
        return App.json( res, 417, App.t(['order','has-been','canceled','by','client'], req.lang) );

      if( mOrder.isRejectedByClient )
        return App.json( res, 417, App.t(['order','has-been','rejected','by','client'], req.lang) );

      if( !mOrder.allSuppliersHaveConfirmed )
        return App.json( res, 417, App.t(['order','has-not-been','confirmed','by','all','restaurants'], req.lang) );

      if( !mOrder.isPaid )
        return App.json( res, 417, App.t(['order','is-not','yet','paid'], req.lang) );

      if( mOrder.isRefunded )
        return App.json( res, 417, App.t(['order','has-been','refunded'], req.lang) );

      if( !App.isArray(mOrder.OrderSuppliers) || !mOrder.OrderSuppliers.length )
        return App.json( res, 404, App.t(['order','suppliers','not-found'], req.lang) );

      const mSupplier = mOrder.OrderSuppliers
        .filter((mSupplier)=>mSupplier.restaurantId===restaurantId)[0];

      if( !App.isObject(mSupplier) || !App.isPosNumber(mSupplier.id) )
        return App.json( res, 404, App.t(['order-supplier','not-found','and','/','or','cannot-be','updated'], req.lang) );

      if( mSupplier.isCanceledByRestaurant )
        return App.json( res, 417, App.t(['order','has-been','canceled','by','restaurant'], req.lang) );

      if( !mSupplier.isAcceptedByRestaurant )
        return App.json( res, 417, App.t(['order','has-not-been','accepter','by','restaurant'], req.lang) );

      // allow to [arrive] event if order is not [isReady=1]
      // if( !mSupplier.isOrderReady )
      //   return App.json( res, 417, App.t(['current','order','is-not','ready'], req.lang) );

      if( mSupplier.isCourierArrived )
        return App.json( res, 417, App.t(['you','have','already','arrived','to','the','current','restaurant'], req.lang) );

      // if( !mSupplier.isCourierArrived )
      //   return App.json( res, 417, App.t(['please','press','[arrived to restaurant]','button','first'], req.lang) );

      if( mSupplier.isTakenByCourier )
        return App.json( res, 417, App.t(['current','order','has-been','already','taken'], req.lang) );

      const updateSupplierRes = await mSupplier.update({
        isCourierArrived: true,
        courierArrivedAt: App.getISODate(),
      });

      if( !App.isObject(updateSupplierRes) || !App.isPosNumber(updateSupplierRes.id) )
        return App.json( res, false, App.t(['failed-to','update','order'], req.lang) );

      await App.json( res, true, App.t(['arrived','successfully'], res.lang) );

      // [post-processing]

      const metadata = {
        orderId: mOrder.id,
        userId: mOrder.Client.User.id,
        clientId: mOrder.Client.id,
        courierId: (mOrder.courierId || 0),
        restaurantId: restaurantId,
      };

      const ackTimeout = (10*1000);
      const notifyData = {
        ack: true,
        event: App.getModel('RestaurantNotification').getEvents()['courierArrived'],
        type: App.getModel('RestaurantNotification').getTypes()['courierArrived'],
        data: metadata, 
      };

      const notifyRes = await App.getModel('RestaurantNotification')
        .notifyById( mSupplier.restaurantId, notifyData, ackTimeout );
      console.log(` #order: ${mOrder.id} => mSupplier: ${mSupplier.id}: notify: ${notifyRes.message}`);

    }catch(e){
      console.log(e);
      App.onRouteError( req, res, e );
      // App.json( res, false, App.t('request-could-not-be-processed', req.lang) );
    }

  });

  return { router, method: '', autoDoc:{} };

};


