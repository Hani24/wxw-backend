const express = require('express');
const router = express.Router();

// {
//   "id": "required: <number>: Ref. Order.id"
// }

// {
//   "id": 10000000004
// }

// /private/client/orders/confirm

module.exports = function(App, RPath){

  router.use('', async(req, res)=>{

    try{

      const data = req.getPost();
      const mUser = await req.user;
      const mClient = await req.client;

      const id = req.getCommonDataInt('id', null);
      const statuses = App.getModel('Order').getStatuses();
      const paymentTypes = App.getModel('OrderPaymentType').getTypes();

      if( App.isNull(id) )
        return await App.json( res, 417, App.t(['Order id is required'], req.lang) );

      mOrder = await App.getModel('Order').findOne({
        where: {
          id,
          clientId: mClient.id,          
        },
        include: [{
          model: App.getModel('OrderSupplier'),
          attributes: [
            'id','restaurantId',
            'isValidChecksum','checksum',
            ...App.getModel('OrderSupplier').getChecksumKeys(),
          ],
          include: [{
            model: App.getModel('OrderSupplierItem'),
            attributes: [
              'id','price','amount',
            ],
            include: [{
              model: App.getModel('MenuItem'),
              attributes: ['id','name'],
            }]
          }]
        }]
      });

      if( !App.isObject(mOrder) || !App.isPosNumber(mOrder.id) )
        return await App.json( res, 404, App.t(['Order not found'], req.lang) );

      // Check if user already has an active order (excluding the current order being confirmed)
      const existingActiveOrder = await App.getModel('Order').findOne({
        where: {
          clientId: mClient.id,
          id: {
            [App.DB.Op.ne]: id  // Not equal to current order
          },
          status: {
            [App.DB.Op.or]: [
              statuses['created'],
              statuses['processing'],
            ]
          },
        },
        attributes: ['id', 'status'],
      });

      if (existingActiveOrder) {
        return App.json(res, 417, App.t(['You already have an active order. Please wait until it is completed before placing a new one.'], req.lang));
      }

      // if( !mOrder.isValidChecksum )
      //   return App.json( res, 403, App.t(['Order Security check error'], req.lang) );

      for( const mOrderSupplier of mOrder.OrderSuppliers ){
        // if( !mOrderSupplier.Restaurant.isValidChecksum )
        //   return App.json( res, 403, App.t(['Restaurant Security check error'], req.lang) );
        if( !mOrderSupplier.isValidChecksum )
          return App.json( res, 403, App.t(['Supplier Security check error'], req.lang) );
      }

      // if for some reason ... (double click, etc ...)
      // bcs of new changes, requested by pm (13-jun-2022)
      if( mOrder.isPaid || mOrder.isRefunded )
        return await App.json( res, 417, App.t(['Current order has been already paid and cannot be updated'], req.lang) );

      if( mOrder.status !== statuses.created )
        return await App.json( res, 417, App.t(['Current order cannot be updated'], req.lang) );

      // Try: Get && Add default Payment-Method if: Client have not sent any Payment-Type
      if( !(await App.getModel('OrderPaymentType').isset({ orderId: mOrder.id })) ){

        const mClientPaymentSettings = await App.getModel('ClientPaymentSettings')
          .getByClientId( mClient.id );

        if( !App.isObject(mClientPaymentSettings) || !App.isPosNumber(mClientPaymentSettings.id) )
          return await App.json( res, false, App.t(['Failed to get clients default payment-settings'], req.lang) );


        if( !App.getModel('OrderPaymentType').isValidType( mClientPaymentSettings.type ) )
          return await App.json( res, false, App.t(['Please update your default payment-settings'], req.lang) );

        if( mClientPaymentSettings.type === paymentTypes.Card ){

          if( App.isNull(mClientPaymentSettings.paymentCardId) )
            return await App.json( res, 417, App.t(['Payment card is required'], req.lang) );

          const mPaymentCard = await App.getModel('PaymentCard').getByFields({
            clientId: mClient.id,
            id: mClientPaymentSettings.paymentCardId,
          });

          if( !App.isObject(mPaymentCard) || !App.isPosNumber(mPaymentCard.id) )
            return await App.json( res, 404, App.t(['Payment card not found'], req.lang) );

        } // else [ ApplePay && GooglePay ]

        const mOrderPaymentType = await App.getModel('OrderPaymentType').create({
          orderId: mOrder.id,
          type: mClientPaymentSettings.type,
          paymentCardId: mClientPaymentSettings.paymentCardId,
        });

        if( !App.isObject(mOrderPaymentType) || !App.isPosNumber(mOrderPaymentType.id) )
          return await App.json( res, false, App.t(['Failed to create order payment type'], req.lang) );


      } // set from defaults

      let mDeliveryAddress = await App.getModel('OrderDeliveryAddress').getByFields({ orderId: mOrder.id });

      // Try: Get && Add default Delivery-Address if: Client have not sent any Delivery-Address
      if( !App.isObject(mDeliveryAddress) ){

        mDeliveryAddress = await App.getModel('DeliveryAddress').findOne({
          where: {
            clientId: mClient.id,
            // isOneTimeAddress: false,
            isDefault: true,
          }
        });

        if( !App.isObject(mDeliveryAddress) || !App.isPosNumber(mDeliveryAddress.id) )
          return await App.json( res, 404, App.t(['Default delivery address not found'], req.lang) );

        const mOrderDeliveryAddress = await App.getModel('OrderDeliveryAddress').create({
          orderId: mOrder.id,
          deliveryAddressId: mDeliveryAddress.id
        });

        if( !App.isObject(mOrderDeliveryAddress) || !App.isPosNumber(mOrderDeliveryAddress.id) )
          return await App.json( res, false, App.t(['Failed to create order delivery-address'], req.lang) );

      }

      // verify that user has set all required data for delivery and payment
      const orderModels = [
        { model: 'OrderDeliveryAddress', message: ['Please','select','delivery','address'/*,'is-required'*/] },
        { model: 'OrderDeliveryTime', message: ['Please','select','delivery','time'/*,'is-required'*/] },
        { model: 'OrderDeliveryType', message: ['Please','select','delivery','type'/*,'is-required'*/] },
        { model: 'OrderPaymentType', message: ['Please','select','payment','type'/*,'is-required'*/] },
      ];

      for( const orderModel of orderModels ){
        if( !( await App.getModel( orderModel.model ).isset({ orderId: mOrder.id }) ) ){
          return await App.json( res, 417, App.t(orderModel.message, req.lang) );
        }
      }

      const mOrderPaymentType = await App.getModel('OrderPaymentType').findOne({
        where:{ orderId: mOrder.id }
      });

      if( !App.isObject(mOrderPaymentType) || !App.isPosNumber(mOrderPaymentType.id) )
        return await App.json( res, 404, App.t(['Order payment type not found'], req.lang) );

      // payment_method_types
      //   card, acss_debit, affirm, afterpay_clearpay, alipay, au_becs_debit, bacs_debit, bancontact, boleto, 
      //   card_present, customer_balance, eps, fpx, giropay, grabpay, ideal, interac_present, klarna, 
      //   konbini, link, oxxo, p24, paynow, sepa_debit, sofort, us_bank_account, and wechat_pay.

      const paymentIntentConfig = {
        // confirm: true, // default: false,
        receipt_email: mUser.email,
        // payment_method_types: ['card'],
        amount: Math.floor( mOrder.finalPrice * 100 ),
        // currency: 'eur',
        customer: mClient.customerId,
        // payment_method: mPaymentCard.paymentMethodId,
        description: `Order: #${mOrder.id}`,
        metadata: {
          orderId: mOrder.id,
          userId: mUser.id,
          clientId: mClient.id,
          totalItems: mOrder.totalItems,
          totalPrice: mOrder.totalPrice,
          totalPriceFee: mOrder.totalPriceFee,
          deliveryPrice: mOrder.deliveryPrice,
          deliveryPriceFee: mOrder.deliveryPriceFee,
          isFreeDelivery: mOrder.isFreeDelivery,
          finalPrice: mOrder.finalPrice,
          _discountType: mOrder.discountType,
          _discountCode: mOrder.discountCode,
          _discountAmount: mOrder.discountAmount,
          // nested objects are not allowed by stripe
          // discount: {
          //   type: mOrder.discountType || 'n/a',
          //   code: mOrder.discountCode || 'n/a',
          //   amount: mOrder.discountAmount || 'n/a',
          // },
        }
      };

      switch( mOrderPaymentType.type ){

        case paymentTypes.Card: {
          const mPaymentCard = await App.getModel('PaymentCard').getById( mOrderPaymentType.paymentCardId );
          if( !App.isObject(mPaymentCard) || !App.isPosNumber(mPaymentCard.id) )
            return await App.json( res, 404, App.t(['Payment card not found'], req.lang) );

          // Reload client to get the latest customerId (important for guest users who just added a card)
          await mClient.reload();

          paymentIntentConfig.payment_method_types = ['card'];
          paymentIntentConfig.payment_method = mPaymentCard.paymentMethodId;
          break;
        }
        case paymentTypes.GooglePay: {
          paymentIntentConfig.payment_method_types = ['card'];
          // paymentIntentConfig.payment_method = mPaymentCard.paymentMethodId; // @this moment it does not exists
          break;
        }
        case paymentTypes.ApplePay: {
          paymentIntentConfig.payment_method_types = ['card'];
          // paymentIntentConfig.payment_method = mPaymentCard.paymentMethodId; // @this moment it does not exists
          break;
        }
        default: {
          return await App.json( res, 417, App.t([`Selected payment method is not supported`], req.lang), {
            supported: paymentTypes
          } );
          break;
        }
      }

      if( App.isString(mOrder.paymentIntentId) || App.isString(mOrder.clientSecret) ){
        const paymentIntentCancelRes = await App.payments.stripe.paymentIntentCancel( mOrder.paymentIntentId, {});
        console.debug(`paymentIntentCancelRes: ${paymentIntentCancelRes.message}`);
      }

      const paymentIntentRes = await App.payments.stripe.paymentIntentCreate( paymentIntentConfig );
      if( !paymentIntentRes.success ){
        console.error({paymentIntentRes});
        return await App.json( res, 417, App.t(paymentIntentRes.message, req.lang) );
      }

      const paymentIntent = paymentIntentRes.data;
      const paymentIntentId = paymentIntent.id;
      const clientSecret = paymentIntent.client_secret; // << from stripe-sdk
      let message = '';

      mOrder = await mOrder.update({
        paymentIntentId,
        clientSecret,
        isPaid: (App.isEnv('dev')),
        paidAt: (App.isEnv('dev') ? App.getISODate() : null),
        checksum: true,
      });

      if( !App.isObject(mOrder) || !App.isPosNumber(mOrder.id) )
        return await App.json( res, false, App.t(['Failed to update payment details'], req.lang) );

      const orderDetails = {
        clientSecret,
        paymentIntentId,
        id: mOrder.id,
        status: mOrder.status,
        order: {
          id: mOrder.id,
          isFreeDelivery: mOrder.isFreeDelivery,
          totalItems: mOrder.totalItems,
          totalPrice: mOrder.totalPrice,
          totalPriceFee: mOrder.totalPriceFee,
          deliveryPrice: mOrder.deliveryPrice,
          deliveryPriceFee: mOrder.deliveryPriceFee,
          finalPrice: mOrder.finalPrice,
          deliveryDistanceValue: mOrder.deliveryDistanceValue,
          deliveryDistanceType: mOrder.deliveryDistanceType,
          items: [],
        }
      };

      // new rule (13-jun-2022) try execute auto-payment if (payment-method == Card)
      if( mOrderPaymentType.type == paymentTypes.Card ){

        const paymentIntentConfirmRes = await App.payments.stripe.paymentIntentConfirm( paymentIntentId );

        if( !paymentIntentConfirmRes.success ){

          console.error(` #Order: ${mOrder.id}: #stripe: paymentIntentConfirmRes: ${paymentIntentConfirmRes.message}`);

          if( !paymentIntentConfirmRes.data.requiresAction ){
            // wrong card, no funds, etc ...
            return await App.json( 
              res, 417, 
              App.t([ paymentIntentConfirmRes.message ], req.lang), 
              { 
                ...orderDetails,
                requiresAction: ( !! paymentIntentConfirmRes.data.requiresAction),
              }
            );
          }

          mOrder = await mOrder.update({
            isPaymentRequested: true,
            paymentRequestedAt: App.getISODate(),
            isClientActionRequired: true,
            clientActionRequiredAt: App.getISODate(),
            checksum: true,
          });

          if( !App.isObject(mOrder) || !App.isPosNumber(mOrder.id) )
            return await App.json( res, false, App.t(['Failed to update 3D-Secure payment details'], req.lang) );

          // probably (3D-Secure is required)
          return await App.json(
            res, 
            417, 
            App.t([ paymentIntentConfirmRes.message ], req.lang), 
            { 
              ...orderDetails,
              requiresAction: ( !! paymentIntentConfirmRes.data.requiresAction),
            }
          );

        }

        const tx = await App.DB.sequelize.transaction( App.DB.getTxOptions() );

        try{
          mOrder = await mOrder.update({
            paymentIntentId,
            clientSecret,
            status: statuses['processing'],
          }, {transaction: tx});

          mOrder = await mOrder.update({checksum: true}, {transaction: tx});
          if( !App.isObject(mOrder) || !App.isPosNumber(mOrder.id) )
            throw Error('Failed update mOrder record');

          await tx.commit();

        }catch(e){
          console.error(e.message);
          await tx.rollback();

          // request [refund] process
          const refundRes = await App.payments.stripe.paymentIntentRefund( paymentIntentId, {
            metadata: paymentIntentConfig.metadata,
          });
          if( !refundRes.success ){
            console.warn({refundRes});
          }

          return await App.json( res, false, App.t(['Failed to update order'], req.lang) );
        }

        mOrder = await mOrder.update({checksum: true});
        if( !App.isObject(mOrder) || !App.isPosNumber(mOrder.id) )
          return await App.json( res, false, App.t(['Failed to finalize order'], req.lang) );

        await App.json( res, true, App.t(['Order has been confirmed and paid'], res.lang), orderDetails );

      }else{

        // push to client for (ApplePay && GooglePay confirmation)
        // mOrder = await mOrder.update({
        //   // paymentIntentId,
        //   // clientSecret,
        //   status: statuses['processing'],
        // });

        // if( !App.isObject(mOrder) || !App.isPosNumber(mOrder.id) )
        //   return await App.json( res, false, App.t(['Failed to','confirm','order'], req.lang) );

        // only required in (ApplePay)
        mOrder.OrderSuppliers.map((mOS)=>{
          mOS.OrderSupplierItems.map((mOSI)=>{
            orderDetails.order.items.push({
              id: mOSI.id,
              amount: mOSI.amount,
              price: mOSI.price,
              name: mOSI.MenuItem.name,
            })
          });
        });

        await App.json( 
          res, 
          true, 
          App.t(['Order created, please confirm', mOrderPaymentType.type ,'payment'], res.lang), 
          orderDetails,
        );

      }

      // [post-process]
      const isEmpty = await App.getModel('Cart').emptyByClientId(mClient.id);

      // [statistic]
      await mClient.update({
        // totalSpend: (mClient.totalSpend +mOrder.finalPrice),
        totalOrders: (mClient.totalOrders +1),
        // totalRejectedOrders: (mClient.totalRejectedOrders +1),
        // totalCanceledOrders: (mClient.totalCanceledOrders +1),
        // totalCompletedOrders: (mClient.totalCompletedOrders +1),
      });

      // push Order details to Resto-Owner email
      // Updated: (https://interexy-com.atlassian.net/browse/MAI-842)
      // Restaurant & Admin: Stop sending emails on each new Order
      // await App.getModel('Order').pushOrderAsMailByOrderId( mOrder.id );

    }catch(e){
      console.log(e);
      App.onRouteError( req, res, e );
      // App.json( res, false, App.t('request-could-not-be-processed', req.lang) );
    }

  });

  return { router, method: '', autoDoc:{} };

};


// {
//   "mOrder": {
//     "id": 10000002054,
//     "clientId": 496,
//     "courierId": null,
//     "clientDescription": "",
//     "discountAmount": 0,
//     "discountCode": "",
//     "status": "processing",
//     "totalPrice": 11.8,
//     "deliveryPrice": 3.79,
//     "deliveryPriceUnitPrice": 0.25,
//     "deliveryPriceUnitType": "kilometer",
//     "finalPrice": 15.59,
//     "totalItems": 4,
//     "isDeliveredByCourier": false,
//     "deliveredByCourierAt": null,
//     "isCourierRatedByClient": false,
//     "courierRatedByClientAt": null,
//     "courierRating": 0,
//     "isOrderRatedByClient": false,
//     "orderRatedByClientAt": null,
//     "isOrderRateRequestSent": false,
//     "orderRateRequestSentAt": null,
//     "isRejectedByClient": false,
//     "rejectedByClientAt": null,
//     "rejectionReason": "",
//     "isCanceledByClient": false,
//     "canceledByClientAt": null,
//     "cancellationReason": "",
//     "isClientDidGetInTouch": false,
//     "clientDidGetInTouchAt": null,
//     "allSuppliersHaveConfirmed": false,
//     "allSuppliersHaveConfirmedAt": null,
//     "paymentIntentId": "pi_3L82hCLkgFoZ4U2T07AuNdOL",
//     "clientSecret": "pi_3L82hCLkgFoZ4U2T07AuNdOL_secret_pSp1guHUFLEIJQLsS46QKzh9B",
//     "isPaymentRequestAllowed": false,
//     "paymentRequestAllowedAt": null,
//     "isPaymentRequested": false,
//     "paymentRequestedAt": null,
//     "isPaid": false,
//     "paidAt": null,
//     "isRefunded": false,
//     "refundedAt": null,
//     "isClientActionRequired": false,
//     "clientActionRequiredAt": null,
//     "isClientActionExecuted": false,
//     "clientActionExecutedAt": null,
//     "isLocked": false,
//     "lockedAt": null,
//     "lockedByNuid": null,
//     "lastCourierId": null,
//     "createdAt": "2022-06-07T11:43:41",
//     "updatedAt": "2022-06-07T13:43:46.893Z",
//     "OrderSuppliers": [
//       {
//         "id": 3142,
//         "restaurantId": 15,
//         "OrderSupplierItems": [
//           {
//             "id": 7368,
//             "price": 2.45,
//             "amount": 2,
//             "MenuItem": {
//               "id": 42,
//               "name": "Super Burger"
//             }
//           },
//           {
//             "id": 7369,
//             "price": 3.45,
//             "amount": 2,
//             "MenuItem": {
//               "id": 43,
//               "name": "Cola"
//             }
//           }
//         ]
//       }
//     ]
//   }
// }


// {
//   "intent": {
//     "id": "pi_3KAeV6LkgFoZ4U2T0Epxks8E",
//     "object": "payment_intent",
//     "amount": 125,
//     "amount_capturable": 0,
//     "amount_received": 0,
//     "application": null,
//     "application_fee_amount": null,
//     "automatic_payment_methods": null,
//     "canceled_at": null,
//     "cancellation_reason": null,
//     "capture_method": "automatic",
//     "charges": {
//       "object": "list",
//       "data": [],
//       "has_more": false,
//       "total_count": 0,
//       "url": "/v1/charges?payment_intent=pi_3KAeV6LkgFoZ4U2T0Epxks8E"
//     },
//     "client_secret": "pi_3KAeV6LkgFoZ4U2T0Epxks8E_secret_eerxLOz1oFuYCIllmmwXdSpWr",
//     "confirmation_method": "automatic",
//     "created": 1640455068,
//     "currency": "eur",
//     "customer": "cus_KcmMsBW1A2E0nl",
//     "description": "Order: #10000000054",
//     "invoice": null,
//     "last_payment_error": null,
//     "livemode": false,
//     "metadata": {
//       "userId": "6",
//       "clientId": "2"
//     },
//     "next_action": null,
//     "on_behalf_of": null,
//     "payment_method": "pm_1JxWpILkgFoZ4U2TkwWw53VZ",
//     "payment_method_options": {
//       "card": {
//         "installments": null,
//         "network": null,
//         "request_three_d_secure": "automatic"
//       }
//     },
//     "payment_method_types": [
//       "card"
//     ],
//     "processing": null,
//     "receipt_email": "ch3ll0v3k@yandex.com",
//     "review": null,
//     "setup_future_usage": null,
//     "shipping": null,
//     "source": null,
//     "statement_descriptor": null,
//     "statement_descriptor_suffix": null,
//     "status": "requires_confirmation",
//     "transfer_data": null,
//     "transfer_group": null
//   }
// }
