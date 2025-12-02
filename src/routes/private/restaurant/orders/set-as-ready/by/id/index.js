const express = require('express');
const router = express.Router();

// {
//   "id": "required: <number> Ref. Order.id"
// }

// {
//   "id": 10000000004
// }

// /private/restaurant/orders/set-as-ready/by/id/

module.exports = function(App, RPath){

  router.use('', async(req, res)=>{

    try{

      const data = req.getPost();
      const mUser = await req.user;
      const mRestaurant = await req.restaurant;
      const statuses = App.getModel('Order').getStatuses();
      const orderTypes = App.getModel('Order').getOrderTypes();

      const id = req.getCommonDataInt('id', null);

      if( !id )
        return App.json( res, 417, App.t(['order','id','is-required'], req.lang) );

      const mOrder = await App.getModel('Order').findOne({
        where: {
          id, // 10000000001
          status: statuses.processing,
          isCanceledByClient: false,
          isRejectedByClient: false,
          isDeliveredByCourier: false,
          isRefunded: false,
          // isPaid: true,
        },
        attributes: [
          'id','status','orderType', // 'totalItems',
          'paymentIntentId', // pi_3KOK8vLkgFoZ4U2T1BMMb01a
          // 'clientSecret',
          'courierId',
          'clientId',
          'isPaid', // 'paidAt',
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
          // Courier can be ignored ... may change on the way
          // {
          //   model: App.getModel('Courier'),
          //   required: true,
          //   attributes: ['id','userId']
          // },
          {
            model: App.getModel('OrderSupplier'),
            required: true,
            where: {
              restaurantId: mRestaurant.id,
              isOrderReady: false,
              isTakenByCourier: false,
              isAcceptedByRestaurant: true,
              isCanceledByRestaurant: false,
            },
            attributes: [
              'id','restaurantId',
              // 'totalPrice','totalItems',
              'isTakenByCourier', // 'takenByCourierAt',
              'isCanceledByRestaurant', // 'canceledByRestaurantAt', // 'cancellationReason',
              'isAcceptedByRestaurant', // 'acceptedByRestaurantAt',
              'isOrderReady', 'orderReadyAt',
              'isOrderDelayed','orderDelayedFor',
            ],
          }
        ]
      });

      // return App.json( res, 417, App.t(['break'], req.lang), {mOrder} );

      if( !App.isObject(mOrder) || !App.isPosNumber(mOrder.id) )
        return App.json( res, 404, App.t(['order','not-found','and','/','or','already','has-been','done/taken/market','as','ready'], req.lang) );

      // Payment validation logic:
      // 1. For catering and on-site-presence orders: payment is handled via payment schedules,
      //    and restaurant acceptance implies payment arrangements are in place.
      // 2. For regular orders:
      //    - If isPaid is true, payment is confirmed (webhook received)
      //    - If order status is 'processing' AND has paymentIntentId, payment was confirmed
      //      by Stripe but webhook may not have been processed yet
      //    - Otherwise, payment is required
      const isCateringOrOnSitePresence =
        mOrder.orderType === orderTypes['catering'] ||
        mOrder.orderType === orderTypes['on-site-presence'];

      const isPaymentConfirmed = mOrder.isPaid ||
        (mOrder.status === statuses.processing && App.isString(mOrder.paymentIntentId) && mOrder.paymentIntentId.length > 0);

      if( !isCateringOrOnSitePresence && !isPaymentConfirmed )
        return App.json( res, 417, App.t(['order','is-not','yet','paid'], req.lang) );

      if( !App.isArray(mOrder.OrderSuppliers) || !mOrder.OrderSuppliers.length )
        return App.json( res, 404, App.t(['order','suppliers','not-found'], req.lang) );

      const mSupplier = mOrder.OrderSuppliers
        .filter((mSupplier)=>mSupplier.restaurantId===mRestaurant.id)[0];

      if( !App.isObject(mSupplier) || !App.isPosNumber(mSupplier.id) )
        return App.json( res, 404, App.t(['order-supplier','not-found'], req.lang) );

      const updateSupplierRes = await mSupplier.update({
        isOrderReady: true,
        orderReadyAt: App.getISODate(),
      });

      if( !App.isObject(updateSupplierRes) || !App.isPosNumber(updateSupplierRes.id) )
        return App.json( res, false, App.t(['failed-to','[mark-as-ready]','the','order'], req.lang) );

      await App.json( res, true, App.t(['order','successfully','done'], res.lang) );

      // [post-processing]

      // Send email notification to client asynchronously (don't block response)
      (async () => {
        try {
          if (App.BrevoMailer && App.BrevoMailer.isEnabled) {
            // Fetch complete order with client/user details
            const mOrderWithDetails = await App.getModel('Order').findByPk(mOrder.id, {
              include: [{
                model: App.getModel('Client'),
                required: true,
                include: [{
                  model: App.getModel('User'),
                  attributes: ['email', 'fullName', 'firstName', 'isGuest']
                }]
              }]
            });

            if (mOrderWithDetails && mOrderWithDetails.Client && mOrderWithDetails.Client.User) {
              const clientUser = mOrderWithDetails.Client.User;

              // Validate email recipient (skip guest users and invalid emails)
              const validation = App.BrevoMailer.validateEmailRecipient(clientUser);
              if (!validation.isValid) {
                console.warn(` #OrderReady: Skipping email for order #${mOrder.id} - ${validation.reason}`);
                return;
              }

              await App.BrevoMailer.sendOrderNotification({
                to: validation.email,
                clientName: clientUser.fullName || clientUser.firstName,
                orderId: mOrder.id,
                type: 'ready',
                data: {
                  restaurantName: mRestaurant.name,
                  hasDelivery: App.isPosNumber(mOrder.courierId),
                  courierAssigned: App.isPosNumber(mOrder.courierId)
                }
              });
              console.ok(` #OrderReady: Email notification sent to ${validation.email} for order #${mOrder.id}`);
            }
          }
        } catch (emailError) {
          console.error(` #OrderReady: Failed to send email notification: ${emailError.message}`);
        }
      })();

      if( App.isPosNumber(mOrder.courierId) ){

        const metadata = {
          orderId: mOrder.id,
          userId: mOrder.Client.User.id,
          clientId: mOrder.Client.id,
          courierId: (mOrder.courierId || 0),
          restaurantId: mRestaurant.id,
        };

        const pushToCourierRes = await App.getModel('CourierNotification')
          .pushToCourierById( mOrder.courierId, {
            type: App.getModel('CourierNotification').getTypes()['supplierOrderIsReady'],
            title: `Order #${mOrder.id}: ${ App.t(['is ready']) }`,
            message: `${mRestaurant.name}: ${ App.t(['You can pickup your order']) }.`,
            data: metadata,
          });

        if( !pushToCourierRes.success ){
          console.error('pushToCourierRes');
          console.json({pushToCourierRes});
        }

        const pushToClientRes = await App.getModel('ClientNotification')
          .pushToClientById( mOrder.Client.id, {
            type: App.getModel('ClientNotification').getTypes()['supplierOrderIsReady'],
            title: `Order #${mOrder.id} is ready`, 
            message: `${ App.t([`Your order from ${mRestaurant.name} is ready! Driver is on its way to get it.`]) }`,
            data: {
              courierId: mOrder.courierId,
              orderId: mOrder.id,
            }
          });

        if( !pushToClientRes.success ){
          console.error('pushToClientRes');
          console.debug({ pushToClientRes });
        }
      }
 const pushToClientRes = await App.getModel('ClientNotification')
          .pushToClientById( mOrder.Client.id, {
            type: App.getModel('ClientNotification').getTypes()['supplierOrderIsReady'],
            title: `Order #${mOrder.id} is ready`, 
            message: `${ App.t([`Your order from ${mRestaurant.name} is ready! You can pick it up!.`]) }`,
            data: {
              courierId: mOrder.courierId,
              orderId: mOrder.id,
            }
          });
    }catch(e){
      console.log(e);
      App.onRouteError( req, res, e );
      // App.json( res, false, App.t('request-could-not-be-processed', req.lang) );
    }

  });

  return { router, method: '', autoDoc:{} };

};


