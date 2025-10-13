const express = require('express');
const router = express.Router();

// /private/courier/orders/current/client-didnt-get-in-touch

module.exports = function(App, RPath){

  router.use('', async(req, res)=>{

    try{

      const data = req.getPost();
      const mUser = await req.user;
      const mCourier = await req.courier;
      const statuses = App.getModel('Order').getStatuses();

      if( !mCourier.isValidChecksum )
        return App.json( res, 403, App.t(['Security check error'], req.lang) );

      if( !mCourier.hasActiveOrder || !App.isPosNumber(mCourier.activeOrderId) )
        return App.json( res, 417, App.t(['You do not have active order'], req.lang) );

      if( !(await App.getModel('Order').isset({
        id: mCourier.activeOrderId, 
        status: statuses.processing,
        courierId: mCourier.id,
      }))){
        return App.json( res, 404, App.t(['Order not found'], req.lang) );        
      }

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
          'isClientDidGetInTouch', // 'clientDidGetInTouchAt',
          'isCanceledByClient', // 'canceledByClientAt','cancellationReason',
          'isRejectedByClient', // 'rejectedByClientAt','rejectionReason',
          'isDeliveredByCourier', // 'deliveredByCourierAt',
          // 'isCourierRatedByClient', // 'courierRatedByClientAt','courierRating',
          'allSuppliersHaveConfirmed',
          'isPaid',
          'isRefunded',
          'deliveryPrice',
          'isValidChecksum',
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
              // restaurantId: restaurantId,
              // isCanceledByRestaurant: false,
              // isAcceptedByRestaurant: true,
              // isOrderReady: true,
              // isTakenByCourier: false,
            },
            attributes: [
              'id','restaurantId',
              // 'totalPrice','totalItems',
              'isCanceledByRestaurant', // 'canceledByRestaurantAt', // 'cancellationReason',
              'isAcceptedByRestaurant', // 'acceptedByRestaurantAt',
              'isOrderReady', 'orderReadyAt',
              'isOrderDelayed','orderDelayedFor',
              'isTakenByCourier', // 'takenByCourierAt',
              'isCourierArrived', // 'courierArrivedAt',
              'isValidChecksum',
              'checksum',
              ...App.getModel('OrderSupplier').getChecksumKeys(),
            ],
            include: [{
              model: App.getModel('Restaurant'),
              attributes: [
                'id','name','isValidChecksum','checksum',
                ...App.getModel('Restaurant').getChecksumKeys(),
              ]
            }]
          }
        ]
      });

      if( !App.isObject(mOrder) || !App.isPosNumber(mOrder.id) )
        return App.json( res, 404, App.t(['Order not found and / or cannot be delivered'], req.lang) );

      if( !mOrder.isValidChecksum )
        return App.json( res, 403, App.t(['Security check error'], req.lang) );

      if( mOrder.isDeliveredByCourier )
        return App.json( res, 417, App.t(['Order has been already delivered'], req.lang) );

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
        if( !mOrderSupplier.isValidChecksum )
          return App.json( res, 403, App.t(['Supplier Security check error'], req.lang) );
        if( !mOrderSupplier.Restaurant.isValidChecksum )
          return App.json( res, 403, App.t(['Restaurant Security check error'], req.lang) );
      }

      const mSupplierWithOrderCompleted = mOrder.OrderSuppliers
        .filter((mSupplier)=>(
          mSupplier.isOrderReady 
          && mSupplier.isTakenByCourier 
          && mSupplier.isAcceptedByRestaurant
          && ( ! mSupplier.isCanceledByRestaurant)
        ));

      if( mSupplierWithOrderCompleted.length !== mOrder.OrderSuppliers.length )
        return App.json( res, 417, App.t(['not-all-suppliers-have-completed-or-courier-did-not-take-order'], req.lang) );

      if( mOrder.OrderSuppliers.filter((mSupplier)=>(!mSupplier.isCourierArrived)).length )
        return App.json( res, 417, App.t(['Please press','[arrived to restaurant]','button first in each restaurant'], req.lang) );

      // if( mOrder.OrderSuppliers.filter((mSupplier)=>mSupplier.isCanceledByRestaurant).length )
      //   return App.json( res, 417, App.t(['Order has been','canceled','by','one','the','restaurants'], req.lang) );

      // if( !mOrder.OrderSuppliers.filter((mSupplier)=>!mSupplier.isAcceptedByRestaurant).length )
      //   return App.json( res, 417, App.t(['Order has-not-been','accepter','by','all','restaurant'], req.lang) );

      // if( !mSupplier.mOrder.OrderSuppliers.filter((mSupplier)=>!mSupplier.isOrderReady).length )
      //   return App.json( res, 417, App.t(['current','order is-not','ready','by','one','or','more','restaurants'], req.lang) );

      // if( !mOrder.OrderSuppliers.filter((mSupplier)=>!mSupplier.isCourierArrived).length )
      //   return App.json( res, 417, App.t(['please','press','[arrived to restaurant]','button','first'], req.lang) );

      // if( !mOrder.OrderSuppliers.filter((mSupplier)=>!mSupplier.isTakenByCourier).length )
      //   return App.json( res, 417, App.t(['current','order has-not-been','collected','by','one','or','more','restaurants'], req.lang) );

      // return App.json( res, 417, App.t(['break...'], res.lang) );

      const tx = await App.DB.sequelize.transaction( App.DB.getTxOptions() );

      try{

        const updateOrder = await mOrder.update({
          status: statuses.delivered,
          isDeliveredByCourier: true,
          deliveredByCourierAt: App.getISODate(),
          isClientDidGetInTouch: false,
          clientDidGetInTouchAt: null,
          checksum: true,
        }, {transaction: tx});

        if( !App.isObject(updateOrder) || !App.isPosNumber(updateOrder.id) ){
          await tx.rollback();
          return App.json( res, false, App.t(['Failed to update order'], res.lang) );
        }

        const updateCourier = await mCourier.update({
          isOrderRequestSent: false,
          orderRequestSentAt: null,
          orderRequestSentByNuid: null,
          hasActiveOrder: false,
          activeOrderId: null,
          activeOrderAt: null,
          balance: +(mCourier.balance + updateOrder.deliveryPrice).toFixed(2),
          // [statistics]
          totalOrders: (mCourier.totalOrders +1),
          totalCompletedOrders: (mCourier.totalCompletedOrders +1),
          totalIncome: +(mCourier.totalIncome + updateOrder.deliveryPrice).toFixed(2), // all time 
          checksum: true,
        }, {transaction: tx});

        if( !App.isObject(updateCourier) || !App.isPosNumber(updateCourier.id) ){
          await tx.rollback();
          return App.json( res, false, App.t(['Failed to update courier'], res.lang) );
        }

        // for( const mOrderSupplier of mOrder.OrderSuppliers ){}
        //   const updateRes = await mSupplier.update({
        //     // checksum: true,
        //   }, {transaction: tx});
        //   if( !App.isObject(mSupplier) || !App.isPosNumber(mSupplier.id) ){
        //     tx.rollback();
        //     return App.json( res, false, App.t(['Failed to','update','order supplier'], res.lang) );
        //   }
        // }

        await tx.commit();

      }catch(e){
        console.log(e);
        await tx.rollback();
        return App.json( res, false, App.t(['Failed to update order status'], res.lang) );
      }

      await App.json( res, true, App.t(['Order has been delivered'], res.lang) );

      // [post-processing]

      const metadata = {
        orderId: mOrder.id,
        userId: mOrder.Client.User.id,
        clientId: mOrder.Client.id,
        courierId: mOrder.courierId,
        // restaurantId: mRestaurant.id,
      };

      {
        const pushToCourierRes = await App.getModel('CourierNotification')
          .pushToCourier( mCourier, {
            type: App.getModel('CourierNotification').getTypes()['courierDeliveredOrder'],
            title: `Order #${mOrder.id} ${App.t(['has been delivered'], req.lang)}.`,
            message: `${App.t(['You have earned $',mOrder.deliveryPrice], mUser.lang)}`,
            data: metadata,
          });
        if( !pushToCourierRes.success ){
          console.error('pushToCourierRes');
          console.json({pushToCourierRes});
        }
      }

      {
        const pushToClientRes = await App.getModel('ClientNotification')
          .pushToClient( mOrder.Client, {
            type: App.getModel('ClientNotification').getTypes()['clientDintGetInTouch'],
            title: `Order #${mOrder.id} ${App.t(['has been delivered'], req.lang)}.`,
            message: App.t([`Order has been delivered but client didn't get in touch`], req.lang),
            data: metadata,
          });
        if( !pushToClientRes.success ){
          console.error('pushToClientRes');
          console.json({pushToClientRes});
        }
      }

      // notify all restos about order delivery
      if( false ){
        const ackTimeout = (10*1000);
        const notifyData = {
          ack: false,
          event: App.getModel('RestaurantNotification').getEvents()['clientDintGetInTouch'],
          type: App.getModel('RestaurantNotification').getTypes()['clientDintGetInTouch'],
          data: metadata, 
        };

        for( const mOrderSupplier of mOrder.OrderSuppliers ){
          const notifyRes = await App.getModel('RestaurantNotification')
            .notifyById( mOrderSupplier.restaurantId, notifyData, ackTimeout );
          console.log(` #order: ${mOrder.id} => mOrderSupplier: ${mOrderSupplier.id}: notify: ${notifyRes.message}`);
        }
      }

    }catch(e){
      console.log(e);
      App.onRouteError( req, res, e );
      // App.json( res, false, App.t('request-could-not-be-processed', req.lang) );
    }

  });

  return { router, method: '', autoDoc:{} };

};


