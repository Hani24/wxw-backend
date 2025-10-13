const express = require('express');
const router = express.Router();

/*
{
  "id": "required: <number> Ref. Order.id",
  "reason": "required: <string> cancellation reason"
}
*/

// /private/restaurant/order-requests/cancel/by/id/

module.exports = function(App, RPath){

  router.use('', async(req, res)=>{

    try{

      // return App.json( res, 417, App.t(['break'], req.lang) );
console.log("canceling the order");
      const mUser = await req.user;
      const mRestaurant = await req.restaurant;
      console.log("canceling the order user: ", mUser);
      console.log("canceling the order restaurant: ", mRestaurant);
      const data = req.getPost();
	          console.log("canceling the order data: ", data);

      const id = req.getCommonDataInt('id', null);
	       console.log("canceling the order id: ", id);
      const cancellationReason = App.tools.strip(req.getCommonDataString('reason',''), 256);
	       console.log("canceling the order cancellationReason: ", cancellationReason);

      const statuses = App.getModel('Order').getStatuses();
	          console.log("canceling the order statuses: ", statuses);

 
      if( !id || !cancellationReason )
        return App.json( res, 417, App.t(['Order id and cancellation reason is required'], req.lang) );

      const mOrder = await App.getModel('Order').findOne({
        where: {
          id,
          isLocked: true,
          courierId: null,
          allSuppliersHaveConfirmed: false,
          isCanceledByClient: false,
          // isRejectedByClient: false,
          // status: statuses['processing'],
        },
        attributes: [
          'id','status','clientId' // ...
        ],
        include: [
          {
            required: true,
            model: App.getModel('Client'),
            attributes: ['id','userId'],
            include: [{
              model: App.getModel('User'),
              attributes: ['id'/*,'firstName','lastName'*/],
            }]
          },
          {
            model: App.getModel('OrderSupplier'),
            required: true,
            where: {
              restaurantId: mRestaurant.id,
              isAcceptedByRestaurant: false,
              isCanceledByRestaurant: false,
              // isRestaurantNotified: true,
              // isRestaurantAcknowledged: true,
            },
            attributes: [
              'id',
              'restaurantId',
              // 'isRestaurantNotified', // 'restaurantNotifiedAt',
              // 'isRestaurantAcknowledged', // 'restaurantAcknowledgedAt',
              'isAcceptedByRestaurant', 'acceptedByRestaurantAt',
              'isCanceledByRestaurant', 'canceledByRestaurantAt','cancellationReason', // + reason
              // 'updatedAt'
            ]
          },
        ]
      });

      if( 
        !App.isObject(mOrder) 
        || !App.isPosNumber(mOrder.id) 
        || !App.isArray(mOrder.OrderSuppliers) 
        || !mOrder.OrderSuppliers.length
      ){
        return App.json( res, 404, App.t(['Order not-found and/or has been canceled by server'], res.lang) );
      }

      const mSupplier = mOrder.OrderSuppliers
        .filter((mSupplier)=>mSupplier.restaurantId===mRestaurant.id)[0];

      if( !App.isObject(mSupplier) || !App.isPosNumber(mSupplier.id) )
        return App.json( res, 404, App.t(['Order supplier not found'], req.lang) );

      const STATUS = mOrder.status;
      const USER_ID = mOrder.Client.User.id;
      const CLIENT_ID = mOrder.clientId;
      // const COURIER_ID = mOrder.courierId;
      // const PAYMENT_INTENT_ID = mOrder.paymentIntentId;
      // const CLIENT_SECRET = mOrder.clientSecret;

      console.debug({
        STATUS,
        USER_ID,
        CLIENT_ID,
        // COURIER_ID,
        // PAYMENT_INTENT_ID,
        // CLIENT_SECRET,
      });

      const tx = await App.DB.sequelize.transaction( App.DB.getTxOptions() );

      try{

        const updateOrderRes = await mOrder.update({
          status: statuses.canceled,
          checksum: true,
        }, {transaction: tx});

        if( !App.isObject(updateOrderRes) || !App.isPosNumber(updateOrderRes.id) ){
          console.error(`#order: ${mOrder.id}: failed to update status`);
          await tx.rollback();
          return App.json( res, false, App.t(['Failed to update order'], res.lang) );
        }

        const updateOrderSupplierRes = await mSupplier.update({
          isCanceledByRestaurant: true,
          canceledByRestaurantAt: App.getISODate(),
          cancellationReason,
          checksum: true,
        }, {transaction: tx});

        if( !App.isObject(updateOrderSupplierRes) || !App.isPosNumber(updateOrderSupplierRes.id) ){
          console.error(`#order: ${mOrder.id}: failed to update OrderSupplier: reason: ${cancellationReason}`);
          await tx.rollback();
          return App.json( res, false, App.t(['Failed to update order'], res.lang) );
        }

        await tx.commit();

      }catch(e){
        console.error(e.message);
        await tx.rollback();
        return App.json( res, false, App.t(['Failed to update order'], req.lang) );
      }

      await App.json( res, true, App.t(['Order request has been canceled'], res.lang) );

      // [post-processing]

      const metadata = {
        orderId: mOrder.id,
        userId: USER_ID,
        clientId: CLIENT_ID,
        // courierId: COURIER_ID,
        restaurantId: mRestaurant.id,
      };

      {
        const pushToClientRes = await App.getModel('ClientNotification')
          .pushToClient( mOrder.Client, {
            type: App.getModel('ClientNotification').getTypes()['supplierCanceledOrder'],
            title: `Order #${mOrder.id}`,
            message: `${mRestaurant.name}: has canceled order: ${cancellationReason}`,
            data: metadata,
          });
        if( !pushToClientRes.success ){
          console.error('pushToClientRes');
          console.json({pushToClientRes});
        }
      }

      const mOtherSuppliers = await App.getModel('OrderSupplier').findAll({
        where: {
          orderId: mOrder.id,
          restaurantId: {
            [ App.DB.Op.not ]: mRestaurant.id
          },
        },
        attributes: [
          'id','restaurantId',
        ],
      });

      if( mOtherSuppliers.length ){
        const ackTimeout = (10*1000);
        const notifyData = {
          ack: true,
          event: App.getModel('RestaurantNotification').getEvents()['supplierCanceledOrder'],
          type: App.getModel('RestaurantNotification').getTypes()['supplierCanceledOrder'],
          data: metadata, 
        };

        for( const mOrderSupplier of mOtherSuppliers ){
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


