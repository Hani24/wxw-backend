const express = require('express');
const router = express.Router();

// /private/courier/orders/current/cancel

module.exports = function(App, RPath){

  router.use('', async(req, res)=>{

    try{

      const data = req.getPost();
      const mUser = await req.user;
      const mCourier = await req.courier;
      const statuses = App.getModel('Order').getStatuses();

      if( !mCourier.hasActiveOrder || !App.isPosNumber(mCourier.activeOrderId) )
        return App.json( res, 417, App.t(['You do not have any active order'], req.lang) );

      const mRequest = await App.getModel('CourierOrderRequest').findOne({
        where: {
          orderId: mCourier.activeOrderId,
          courierId: mCourier.id,
        },
        attributes: [
          'id','isRejected','isAccepted',
        ]
      });

      if( !App.isObject(mRequest) || !App.isPosNumber(mRequest.id) )
        return App.json( res, 417, App.t(['Active order not found'], req.lang) );

      const mOrder = await App.getModel('Order').findOne({
        model: App.getModel('Order'),
        where: {
          id: mCourier.activeOrderId,
          status: statuses.processing,
          courierId: mCourier.id,
          isLocked: false,
        },
        attributes: [
          'id','status', // 'totalItems',
          'isDeliveredByCourier', // 'deliveredByCourierAt',
          'isCourierRatedByClient', // 'courierRatedByClientAt','courierRating',
          'isRejectedByClient', // 'rejectedByClientAt','rejectionReason',
          'isCanceledByClient', // 'canceledByClientAt','cancellationReason',
          'allSuppliersHaveConfirmed',
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
        return App.json( res, 404, App.t(['No active order found'], req.lang) );

      if( !mOrder.isValidChecksum )
        return App.json( res, 403, App.t(['Order Security check error'], req.lang) );

      // Courier can cancel
      // if( mOrder.allSuppliersHaveConfirmed )
      //   return App.json( res, 417, App.t(['The current order has been accepted by all restaurants and cannot be canceled.'], req.lang) );

      if( mOrder.isCanceledByClient || mOrder.status === statuses.canceled )
        return App.json( res, 417, App.t(['Current order has been canceled by client'], req.lang) );

      if( mOrder.isDeliveredByCourier )
        return App.json( res, 417, App.t(['Current order has been delivered'], req.lang) );

      // if( mOrder.status !== statuses.processing )
      //   return App.json( res, 417, App.t(['Current','order','with','status',`[${mOrder.status}]`,'cannot-be','canceled'], req.lang) );

      const isTakenByCourier = ( !! mOrder.OrderSuppliers.filter((mSupplier)=>(mSupplier.isTakenByCourier)).length);
      if( isTakenByCourier || mOrder.isDeliveredByCourier )
        return App.json( res, 417, App.t(['Current order cannot be canceled'], req.lang) );

      const tx = await App.DB.sequelize.transaction( App.DB.getTxOptions() );

      try{

        const takeOrderLock = await mOrder.update({
          isLocked: true,
        }, {transaction: tx});

        if( !App.isObject(takeOrderLock) || (! takeOrderLock.isLocked) ){
          console.error(` Courier:order:cancel: could not take order-lock; id: ${mOrder.id}`);
          await tx.rollback();
          return App.json( res, false, App.t(['Failed to lock order'], req.lang) );
        }

        // only for statistic of de courier
        await mRequest.update({ isRejected: true }, { transaction: tx });

        // clear current order from courier and put in back in (find courier loop) 
        const updateOrder = await mOrder.update({
          courierId: null,
          checksum: true,
          // status: statuses.canceled, // do not cancel, order is valid
        }, { transaction: tx });

        if( !App.isObject(updateOrder) || !App.isPosNumber(updateOrder.id) ){
          console.error(` failed to updated order id: ${mOrder.id}`);
          await tx.rollback();
          return App.json( res, false, App.t(['Failed to update order'], req.lang) );
        }

        // clear courier from current-order  
        const updateCourier = await mCourier.update({
          totalCanceledOrders: (mCourier.totalCanceledOrders +1),
          hasActiveOrder: false,
          activeOrderId: null,
          activeOrderAt: null,
          isOrderRequestSent: false,
          orderRequestSentAt: null,
          orderRequestSentByNuid: null,
          checksum: true,
        }, { transaction: tx });

        if( !App.isObject(updateCourier) || !App.isPosNumber(updateCourier.id) ){
          console.error(` failed to updated courier @ order id: ${mOrder.id}`);
          await tx.rollback();
          return App.json( res, false, App.t(['Failed to update courier'], req.lang) );
        }

        // console.json({updateCourier});
        const releaseOrderLock = await mOrder.update(
          {isLocked: false}, 
          {transaction: tx}
        );

        if( !App.isObject(releaseOrderLock) || releaseOrderLock.isLocked ){
          console.error(` Courier:order:cancel: could not release order-lock; id: ${mOrder.id}`);
          await tx.rollback();
          return App.json( res, false, App.t(['Failed to canceled order'], req.lang) );
        }

        await tx.commit();
        App.json( res, true, App.t(['Order has been canceled'], res.lang) );

      }catch(e){
        console.error(`#courier: cancel the order: ${e.message}`);
        App.json( res, false, App.t(['Failed to cancel order'], res.lang) );
        await tx.rollback();
      }

    }catch(e){
      console.log(e);
      App.onRouteError( req, res, e );
      // App.json( res, false, App.t('request-could-not-be-processed', req.lang) );
    }

  });

  return { router, method: '', autoDoc:{} };

};


