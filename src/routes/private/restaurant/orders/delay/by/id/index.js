const express = require('express');
const router = express.Router();

// {
//   "id": "required: <number> Ref. Order.id",
//   "delay": "required: ENUM: <number>: [ 5 | 10 | 15 ] min"
// }

// {
//   "id": 10000000004,
//   "delay": 15
// }

// /private/restaurant/orders/delay/by/id/

module.exports = function(App, RPath){

  router.use('', async(req, res)=>{

    try{

      const mUser = await req.user;
      const mRestaurant = await req.restaurant;
      const data = req.getPost();

      const delays = App.getModel('OrderSupplier').getDelays({asArray: true});
      const statuses = App.getModel('Order').getStatuses();

      const id = req.getCommonDataInt('id', null);
      const delay = req.getCommonDataInt('delay', null);

      if( !id || !delay )
        return App.json( res, 417, App.t(['Order id and delay is required'], req.lang) );

      if( !delays.includes( delay ) )
        return App.json( res, 417, App.t(['Allowed order delays',], req.lang), {delays} );

      const mOrder = await App.getModel('Order').findOne({
        where: {
          id, // 10000000001
          status: statuses.processing, 
          isCanceledByClient: false,
          isRejectedByClient: false,
          // isPaid: true,
          // isRefunded: false,
          isDeliveredByCourier: false,
        },
        attributes: [
          'id','status', // 'totalItems',
          // 'paymentIntentId', // pi_3KOK8vLkgFoZ4U2T1BMMb01a
          // 'clientSecret',
          'courierId',
          'clientId',
          'isPaid', // 'paidAt',
          'expectedDeliveryTime',
          'allSuppliersHaveConfirmedAt',
          'checksum',
          ...App.getModel('Order').getChecksumKeys(),
        ],
        include: [
          {
            required: true,
            model: App.getModel('Client'),
            attributes: ['id','userId'],
            include: [{
              model: App.getModel('User'),
              attributes: ['id','timezone'],
            }]
          },
          // {
          //   model: App.getModel('Courier'),
          //   attributes: ['id','userId'],
          //   // include: [{
          //   //   model: App.getModel('User'),
          //   //   attributes: ['id','timezone'],
          //   // }]
          // },
          {
            model: App.getModel('OrderSupplier'),
            required: true,
            where: {
              restaurantId: mRestaurant.id,
              isOrderReady: false,
              isTakenByCourier: false,
              isAcceptedByRestaurant: true,
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

      if( !App.isObject(mOrder) || !App.isPosNumber(mOrder.id) )
        return App.json( res, 404, App.t(['Order not found and/or cannot-be delayed'], req.lang));

      if( !mOrder.isPaid )
        return App.json( res, 417, App.t(['Order is not yet paid'], req.lang) );

      if( !App.isArray(mOrder.OrderSuppliers) || !mOrder.OrderSuppliers.length )
        return App.json( res, 404, App.t(['Order suppliers not found'], req.lang) );

      const mSupplier = mOrder.OrderSuppliers
        .filter((mSupplier)=>mSupplier.restaurantId===mRestaurant.id)[0];

      if( !App.isObject(mSupplier) || !App.isPosNumber(mSupplier.id) )
        return App.json( res, 404, App.t(['Order supplier not found and/or cannotbe delayed'], req.lang) );

      const updateSupplierRes = await mSupplier.update({
        orderDelayedFor: mSupplier.orderDelayedFor + delay,
        isOrderDelayed: true,
        orderDelayedAt: App.getISODate(),
        // checksum: true,
      });

      if( !App.isObject(updateSupplierRes) || !App.isPosNumber(updateSupplierRes.id) )
        return App.json( res, false, App.t(['Failed to delay the order'], req.lang) );

      // GMT+0
      console.json({
        np: mOrder.expectedDeliveryTime,
        ad: App.DT.moment(mOrder.expectedDeliveryTime).add(delay, 'minutes').format( App.getDateFormat() ),
      });

      const expectedDeliveryTime = App.DT.moment(mOrder.expectedDeliveryTime)
        .add(delay, 'minutes')
        .format( App.getDateFormat() );

      const updateOrder = await mOrder.update({ expectedDeliveryTime });
      await App.json( res, true, App.t(['Order has been delayed for', delay,'min.'], res.lang) );

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
                  attributes: ['email', 'fullName', 'firstName']
                }]
              }]
            });

            if (mOrderWithDetails && mOrderWithDetails.Client && mOrderWithDetails.Client.User) {
              const clientUser = mOrderWithDetails.Client.User;

              // Validate email recipient (skip if no valid email)
              const validation = App.BrevoMailer.validateEmailRecipient(clientUser);
              if (!validation.isValid) {
                console.warn(` #OrderDelayed: Skipping email for order #${mOrder.id} - ${validation.reason}`);
                return;
              }

              await App.BrevoMailer.sendOrderNotification({
                to: validation.email,
                clientName: clientUser.fullName || clientUser.firstName,
                orderId: mOrder.id,
                type: 'delayed',
                data: {
                  restaurantName: mRestaurant.name,
                  delayMinutes: delay,
                  totalDelayMinutes: updateSupplierRes.orderDelayedFor,
                  newDeliveryTime: expectedDeliveryTime
                }
              });
              console.ok(` #OrderDelayed: Email notification sent to ${validation.email} for order #${mOrder.id}`);
            }
          }
        } catch (emailError) {
          console.error(` #OrderDelayed: Failed to send email notification: ${emailError.message}`);
        }
      })();

      // [post-processing]
      const metadata = {
        orderId: mOrder.id,
        userId: mOrder.Client.User.id,
        clientId: mOrder.Client.id,
        courierId: (mOrder.courierId || 0),
        restaurantId: mRestaurant.id,
        // expectedDeliveryTime: App.DT.moment(expectedDeliveryTime).tz( mOrder.Client.User.timezone ).format( App.getDateFormat() ),
        // allSuppliersHaveConfirmedAt: App.DT.moment(allSuppliersHaveConfirmedAt).tz( mOrder.Client.User.timezone ).format( App.getDateFormat() ),
      };

      // console.json({metadata})

      if( App.isPosNumber(mOrder.courierId) ){
        const mCourier = await App.getModel('Courier').findOne({
          where: {
            id: mOrder.courierId,
            activeOrderId: mOrder.id,            
          },
          attributes: ['id','userId','activeOrderId'],
        });
        if( App.isObject(mCourier) && App.isPosNumber(mCourier.id) ){
          const pushToCourierRes = await App.getModel('CourierNotification')
            .pushToCourier( mCourier, {
              type: App.getModel('CourierNotification').getTypes()['supplierOrderDelayed'],
              title: `Order #${mOrder.id} delay.`,
              message: `${mRestaurant.name}: ${ App.t(['has delay of', delay, 'min.']) }`,
              data: {
                ...metadata,
                ...( App.isObject(mOrder.Courier) && App.isObject(mOrder.Courier.User) 
                  ? {
                    expectedDeliveryTime: App.DT.moment(updateOrder.expectedDeliveryTime).tz( mOrder.Courier.User.timezone ).format( App.getDateFormat() ),
                    allSuppliersHaveConfirmedAt: App.DT.moment(updateOrder.allSuppliersHaveConfirmedAt).tz( mOrder.Courier.User.timezone ).format( App.getDateFormat() ),
                  } 
                  : {
                    expectedDeliveryTime: mOrder.expectedDeliveryTime,
                    allSuppliersHaveConfirmedAt: mOrder.allSuppliersHaveConfirmedAt,
                  }
                ),

              },
            });

          if( !pushToCourierRes.success ){
            console.error('pushToCourierRes');
            console.json({pushToCourierRes});
          }
        }else{
          console.error(`#Order: ${mOrder.id}: has no Courier assigned, but courierId has been assigned to: ${mOrder.courierId}`);
        }
      }

      console.json({
        user: {
          timezone: mOrder.Client.User.timezone,
        },
        ntz: {
          expectedDeliveryTime: updateOrder.expectedDeliveryTime,
          allSuppliersHaveConfirmedAt: updateOrder.allSuppliersHaveConfirmedAt,
        },
        tz: {
          expectedDeliveryTime: App.DT.moment(updateOrder.expectedDeliveryTime).tz( mOrder.Client.User.timezone ).format( App.getDateFormat() ),
          allSuppliersHaveConfirmedAt: App.DT.moment(updateOrder.allSuppliersHaveConfirmedAt).tz( mOrder.Client.User.timezone ).format( App.getDateFormat() ),          
        }
      });

      const pushToClientRes = await App.getModel('ClientNotification')
        .pushToClient( mOrder.Client, {
          type: App.getModel('ClientNotification').getTypes()['supplierOrderDelayed'],
          title: `Order #${mOrder.id} delay.`,
          message: `${mRestaurant.name}: ${ App.t(['has delay of', delay, 'min.']) }`,
          data: {
            ...metadata,
            expectedDeliveryTime: App.DT.moment(updateOrder.expectedDeliveryTime).tz( mOrder.Client.User.timezone ).format( App.getDateFormat() ),
            allSuppliersHaveConfirmedAt: App.DT.moment(updateOrder.allSuppliersHaveConfirmedAt).tz( mOrder.Client.User.timezone ).format( App.getDateFormat() ),
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


