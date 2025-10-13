const express = require('express');
const router = express.Router();

// {
//   "restaurantId": "required: <number> Ref. Restaurant.id"
// }

// /private/courier/orders/take/by/restaurant/id/

module.exports = function(App, RPath){

  router.use('', async(req, res)=>{

    try{

      const data = req.getPost();
      const mUser = await req.user;
      const mCourier = await req.courier;

      if( !mCourier.isValidChecksum )
        return App.json( res, 403, App.t(['Security check error'], req.lang) );

      if( !mCourier.hasActiveOrder || !mCourier.activeOrderId )
        return App.json( res, 404, App.t(['you','do-not','have','active','order'], req.lang) );

      const restaurantId = req.getCommonDataInt('restaurantId', null);

      if( App.isNull(restaurantId) )
        return App.json( res, 417, App.t(['restaurant','id','is-required'], req.lang) );

      if( !(await App.getModel('Restaurant').isset({id: restaurantId})) )
        return App.json( res, 404, App.t(['restaurant','not found'], req.lang) );

      const statuses = App.getModel('Order').getStatuses();

      const mOrder = await App.getModel('Order').findOne({
        where: {
          id: mCourier.activeOrderId, // 10000000001
          status: statuses.processing, 
          courierId: mCourier.id,
          // isCanceledByClient: false,
          // isRejectedByClient: false,
          // allSuppliersHaveConfirmed: true,
          // isPaid: true,
          // isRefunded: false,
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
          'isValidChecksum',
          'totalPrice',
          'totalItems',
          'checksum',
          ...App.getModel('Order').getChecksumKeys(),
        ],
        include: [
          // {
          //   required: true,
          //   model: App.getModel('Courier'),
          //   attributes: ['id','userId','hasActiveOrder','activeOrderId','activeOrderAt'],
          //   include: [{
          //     model: App.getModel('User'),
          //     attributes: ['id'],
          //   }]
          // },
          {
            required: true,
            model: App.getModel('Client'),
            attributes: ['id','userId'],
            include: [{
              model: App.getModel('User'),
              attributes: ['id'],
            }]
          },
          {
            model: App.getModel('OrderSupplier'),
            required: true,
            where: {
              restaurantId: restaurantId,
              // isCanceledByRestaurant: false,
              // isAcceptedByRestaurant: true,
              // isOrderReady: true,
              // isTakenByCourier: false,
            },
            attributes: [
              'id','orderId','restaurantId','totalPrice','totalItems','isAppliedToBalance', 'appliedToBalanceAt',
              'isTakenByCourier', // 'takenByCourierAt',
              'isCanceledByRestaurant', // 'canceledByRestaurantAt', // 'cancellationReason',
              'isAcceptedByRestaurant', // 'acceptedByRestaurantAt',
              'isCourierArrived', 'courierArrivedAt',
              'isOrderReady', // 'orderReadyAt',
              // 'isOrderDelayed','orderDelayedFor',
              'checksum',
              'isValidChecksum',
              ...App.getModel('OrderSupplier').getChecksumKeys(),
            ],
            include: [{
              model: App.getModel('Restaurant'),
              attributes: [
                'id','name','checksum','isValidChecksum',
                ...App.getModel('Restaurant').getChecksumKeys(),
              ]
            }]
          }
        ]
      });

      // console.json({
      //   order: {
      //     checksum: mOrder.checksum,
      //     calc: App.getModel('Order').getChecksum(mOrder),
      //   },
      //   suppliers: mOrder.OrderSuppliers.map((mSupplier)=>{
      //     return {
      //       supplier: {
      //         checksum: mSupplier.checksum,
      //         calc: App.getModel('OrderSupplier').getChecksum(mSupplier),
      //         restaurant: {
      //           checksum: mSupplier.Restaurant.checksum,
      //           calc: App.getModel('Restaurant').getChecksum(mSupplier.Restaurant),                
      //         }
      //       }
      //     }
      //   })
      // });

      if( !App.isObject(mOrder) || !App.isPosNumber(mOrder.id) )
        return App.json( res, 404, App.t(['Order not found and/or cannot be taken'], req.lang) );

      if( !mOrder.isValidChecksum )
        return App.json( res, 403, App.t(['Order Security check error'], req.lang) );

      if( mOrder.isCanceledByClient )
        return App.json( res, 417, App.t(['Order has been canceled by client'], req.lang) );

      if( mOrder.isRejectedByClient )
        return App.json( res, 417, App.t(['Order has been rejected by client'], req.lang) );

      if( !mOrder.allSuppliersHaveConfirmed )
        return App.json( res, 417, App.t(['Order is not confirmed by all restaurants'], req.lang) );

      if( !mOrder.isPaid )
        return App.json( res, 417, App.t(['Order is not paid by client'], req.lang) );

      if( mOrder.isRefunded )
        return App.json( res, 417, App.t(['Order has been refunded'], req.lang) );

      if( !App.isArray(mOrder.OrderSuppliers) || !mOrder.OrderSuppliers.length )
        return App.json( res, 404, App.t(['Order suppliers not found'], req.lang) );

      for( const mOrderSupplier of mOrder.OrderSuppliers ){
        if( !mOrderSupplier.Restaurant.isValidChecksum )
          return App.json( res, 403, App.t(['Restaurant Security check error'], req.lang) );
        if( !mOrderSupplier.isValidChecksum )
          return App.json( res, 403, App.t(['Supplier Security check error'], req.lang) );
      }

      const mSupplier = mOrder.OrderSuppliers
        .filter((mSupplier)=>mSupplier.restaurantId===restaurantId)[0];

      if( !App.isObject(mSupplier) || !App.isPosNumber(mSupplier.id) )
        return App.json( res, 404, App.t(['Order supplier not found'], req.lang) );

      if( mSupplier.isCanceledByRestaurant )
        return App.json( res, 417, App.t(['Order has been canceled by restaurant'], req.lang) );

      if( !mSupplier.isAcceptedByRestaurant )
        return App.json( res, 417, App.t(['Order is not accepter by restaurant'], req.lang) );

      if( !mSupplier.isOrderReady )
        return App.json( res, 417, App.t(['Current order is not ready'], req.lang) );

      if( !mSupplier.isCourierArrived )
        return App.json( res, 417, App.t(['Please press','[arrived to restaurant]','button first'], req.lang) );

      if( mSupplier.isTakenByCourier )
        return App.json( res, 417, App.t(['Current order has been already taken'], req.lang) );

      const updateRes = await mSupplier.update({
        isTakenByCourier: true,
        takenByCourierAt: App.getISODate(),
      });

      if( !App.isObject(updateRes) || !App.isPosNumber(updateRes.id) )
        return App.json( res, false, App.t(['Failed to update order'], res.lang) );

      await App.json( res, true, App.t(['Order taken successfully'], res.lang) );

      // [post-processing]

      // const totalSuppliers = await App.getModel('OrderSuppliers').getTotalWhere({
      //   orderId: mCourier.activeOrderId,
      // });

      // const totalCompletedSuppliers = await App.getModel('OrderSuppliers').getTotalWhere({
      //   orderId: mCourier.activeOrderId,
      //   isTakenByCourier: true,
      //   isOrderReady: true,
      // });

      const mOrderInfo = await App.getModel('Order').findOne({
        where: { id: mCourier.activeOrderId },
        attributes: [ 'id' ],
        include: [{
          model: App.getModel('OrderSupplier'),
          required: true,
          attributes: ['id','isTakenByCourier','isOrderReady'],
        }]
      });

      const totalCompletedOrders = mOrderInfo.OrderSuppliers
        .filter((mSupplier)=>(mSupplier.isOrderReady&&mSupplier.isTakenByCourier))
        .length;

      if( mOrderInfo.OrderSuppliers.length !== totalCompletedOrders )
        return;

      const pushToClientRes = await App.getModel('ClientNotification')
        .pushToClient( mOrder.Client, {
          type: App.getModel('ClientNotification').getTypes()['courierHasCollectedTheOrders'],
          title: `Order #${mOrder.id} Updated`,
          message: `${ App.t(['Driver has collected the order and is on its way to you!']) }`,
          // message: `${ App.t(['Your driver is on the way to you']) }`,
          // message: `${ App.t(['Your driver is on your way']) }`,
          // message: `${ App.t(['Your driver is coming to you']) }`,
          data: {
            orderId: mOrder.id,
            userId: mOrder.Client.User.id,
            clientId: mOrder.Client.id,
            courierId: mOrder.courierId,
          },
        });

      if( !pushToClientRes.success ){
        console.error('pushToClientRes');
        console.json({pushToClientRes});
      }

    }catch(e){
      console.log(e);
      App.onRouteError( req, res, e );
      // App.json( res, false, App.t('request-could-not-be-processed', req.lang) );
    }

  });

  return { router, method: '', autoDoc:{} };

};


