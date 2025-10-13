const express = require('express');
const router = express.Router();

// {
//   "id": "required: <number> Ref. Order.id",
//   "reason": "optional: <string>: some description"
// }

// {
//   "id": 10000000004,
//   "reason": "some cancellation description"
// }

// /private/client/orders/cancel/by/id/

module.exports = function(App, RPath){

  router.use('', async(req, res)=>{

    try{

      const mUser = await req.user;
      const mClient = await req.client;
      const data = req.getPost();
      const id = req.getCommonDataInt('id',null);
      const cancellationReason = App.tools.strip(req.getCommonDataString('reason',''), 256);

      if( App.isNull(id) )
        return App.json( res, 417, App.t(['Order id is required'], req.lang) );

      const statuses = App.getModel('Order').getStatuses();
      let mCourier = null;

      const mOrder = await App.getModel('Order').findOne({
        where: {
          id, // 10000000001
          clientId: mClient.id,          
        },
        attributes: [
          'id',
          'allSuppliersHaveConfirmed',
          'paymentIntentId', // pi_3KOK8vLkgFoZ4U2T1BMMb01a
          'clientSecret',
          'status', // 'totalItems',
          'courierId',
          'clientId',
          'isDeliveredByCourier', // 'deliveredByCourierAt',
          'isCourierRatedByClient', // 'courierRatedByClientAt','courierRating',
          'isRejectedByClient', // 'rejectedByClientAt','rejectionReason',
          'isCanceledByClient', // 'canceledByClientAt','cancellationReason',
          'isPaid',
          'isRefunded',
          'finalPrice',
          'isValidChecksum','checksum',
          ...App.getModel('Order').getChecksumKeys(),
        ],
        include: [
          {
            model: App.getModel('OrderSupplier'),
            required: true,
            attributes: [
              'id','restaurantId',
              // 'totalPrice','totalItems',
              'isTakenByCourier', // 'takenByCourierAt',
              'isCanceledByRestaurant', // 'canceledByRestaurantAt', // 'cancellationReason',
              'isAcceptedByRestaurant', // 'acceptedByRestaurantAt',
              'isOrderReady', // 'orderReadyAt',
              'isOrderDelayed','orderDelayedFor',
              'isValidChecksum','checksum',
              ...App.getModel('OrderSupplier').getChecksumKeys(),
            ],
          }
        ]
      });

      if( !App.isObject(mOrder) || !App.isPosNumber(mOrder.id) )
        return App.json( res, 404, App.t(['Order id not found'], req.lang) );

      if( !mOrder.isValidChecksum )
        return App.json( res, 403, App.t(['Order Security check error'], req.lang) );

      if( mOrder.isCanceledByClient || mOrder.status === statuses.canceled )
        return App.json( res, 417, App.t(['Current order has-been canceled'], req.lang) );

      if( mOrder.isDeliveredByCourier )
        return App.json( res, 417, App.t(['Current order has-been delivered'], req.lang) );

      if( mOrder.status !== statuses['processing'] )
        return App.json( res, 417, App.t(['Current order with status',`[${mOrder.status}]`,'cannot be canceled'], req.lang) );

      for( const mOrderSupplier of mOrder.OrderSuppliers ){
        // if( !mOrderSupplier.Restaurant.isValidChecksum )
        //   return App.json( res, 403, App.t(['Restaurant Security check error'], req.lang) );
        if( !mOrderSupplier.isValidChecksum )
          return App.json( res, 403, App.t(['Supplier Security check error'], req.lang) );
      }

      const isTakenByCourier = ( !! mOrder.OrderSuppliers.filter((mSupplier)=>mSupplier.isTakenByCourier).length);
      if( isTakenByCourier || mOrder.isDeliveredByCourier )
        return App.json( res, 417, App.t(
          mOrder.isDeliveredByCourier
            ? ['Current order has been already delivered']
            : ['Current order cannot be canceled, courier has already taken order'],
          req.lang
        )
      );

      // ADDED: 19-Jul-2022: https://interexy-com.atlassian.net/browse/MAI-1002
      // if( App.isEnv('stage') || App.isEnv('prod') )
      if( mOrder.allSuppliersHaveConfirmed )
        return App.json( res, 417, App.t(['The current order has been accepted by all restaurants and cannot be canceled.'], req.lang) );

      const STATUS = mOrder.status;
      const USER_ID = mUser.id;
      const CLIENT_ID = mOrder.clientId;
      const COURIER_ID = mOrder.courierId;
      const PAYMENT_INTENT_ID = mOrder.paymentIntentId;
      const CLIENT_SECRET = mOrder.clientSecret;

      // console.debug({
      //   STATUS,
      //   USER_ID,
      //   CLIENT_ID,
      //   COURIER_ID,
      //   PAYMENT_INTENT_ID,
      //   CLIENT_SECRET,
      // });

      const tx = await App.DB.sequelize.transaction( App.DB.getTxOptions() );

      try{

        const updateOrderRes = await mOrder.update({
          courierId: null,
          status: statuses.canceled,
          isCanceledByClient: true,
          canceledByClientAt: App.getISODate(),
          cancellationReason,
          // paymentIntentId: null,
          // clientSecret: null,
          checksum: true,
        }, {transaction: tx});

        if( !App.isObject(updateOrderRes) || !App.isPosNumber(updateOrderRes.id) ){
          await tx.rollback();
          return App.json( res, false, App.t(['Failed to cancel order'], req.lang) );
        }

        if( App.isPosNumber(COURIER_ID) ){

          // release Courier from current order
          mCourier = await App.getModel('Courier').findOne({
            where: { id: COURIER_ID },
            attributes: ['id','userId','hasActiveOrder','activeOrderId','activeOrderAt'],
            transaction: tx,
          });

          if( App.isObject(mCourier) && App.isPosNumber(mCourier.id) ){

            const updateCourierRes = await mCourier.update({
              isOrderRequestSent: false,
              orderRequestSentAt: null,
              orderRequestSentByNuid: null,
              hasActiveOrder: false,
              activeOrderId: null,
              activeOrderAt: null,
            }, {transaction: tx});

            if( !App.isObject(updateCourierRes) || !App.isPosNumber(updateCourierRes.id) ){
              console.error(` failed to update / release Courier from current order`);
              await tx.rollback();
              return App.json( res, false, App.t(['Failed to update Courier'], req.lang) );
            }

          }
        }

        await tx.commit();

      }catch(e){
        console.error(e.message);
        await tx.rollback();
        return App.json( res, false, App.t(['Failed to update order'], req.lang) );
      }

      await App.json( res, true, App.t(['order hasbeen canceled'], res.lang) );

      // [post-processing]

      const metadata = {
        orderId: mOrder.id,
        userId: USER_ID,
        clientId: CLIENT_ID,
        courierId: COURIER_ID,
      };

      // request refunded anyway ...
      if( App.isString(PAYMENT_INTENT_ID) /*&& mOrder.isPaid && !mOrder.isRefunded*/ ){
        console.debug(`#${mOrder.id}: PAYMENT_INTENT_ID: ${PAYMENT_INTENT_ID}, CLIENT_SECRET: ${CLIENT_SECRET} `);
        const paymentIntentRefundRes = await App.payments.stripe.paymentIntentRefund( PAYMENT_INTENT_ID, {
          // reason: cancellationReason,
          metadata,
        });
        console.debug(`paymentIntentRefundRes: ${paymentIntentRefundRes.message}`);
      }

      if( App.isString(PAYMENT_INTENT_ID) /*&& mOrder.isPaid && !mOrder.isRefunded*/ ){
        const paymentIntentCancelRes = await App.payments.stripe.paymentIntentCancel( PAYMENT_INTENT_ID, {});
        console.debug(`paymentIntentCancelRes: ${paymentIntentCancelRes.message}`);
      }

      if( App.isObject(mCourier) && App.isPosNumber(mCourier.id) ){
        const pushToCourierRes = await App.getModel('CourierNotification')
          .pushToCourier( mCourier, {
            type: App.getModel('CourierNotification').getTypes()['clientCanceledOrder'],
            title: `Order #${mOrder.id} ${ App.t(['has-been','canceled']) }`,
            message: `${ App.t(['Client has canceled order']) }`,
            data: metadata,
          });
        if( !pushToCourierRes.success ){
          console.error('pushToCourierRes');
          console.json({pushToCourierRes});
        }
      }

      const ackTimeout = (10*1000);
      const notifyData = {
        ack: true,
        event: App.getModel('RestaurantNotification').getEvents()['clientCanceledOrder'],
        type: App.getModel('RestaurantNotification').getTypes()['clientCanceledOrder'],
        data: {
          orderId: mOrder.id,
          clientId: CLIENT_ID,
          courierId: COURIER_ID,
        }, 
      };

      for( const mOrderSupplier of mOrder.OrderSuppliers ){
        const notifyRes = await App.getModel('RestaurantNotification')
          .notifyById( mOrderSupplier.restaurantId, notifyData, ackTimeout );
        console.log(` #order: ${mOrder.id} => mOrderSupplier: ${mOrderSupplier.id}: notify: ${notifyRes.message}`);
      }

    }catch(e){
      console.log(e);
      App.onRouteError( req, res, e );
      // App.json( res, false, App.t('request-could-not-be-processed', req.lang) );
    }

  });

  return { router, method: '', autoDoc:{} };

};


