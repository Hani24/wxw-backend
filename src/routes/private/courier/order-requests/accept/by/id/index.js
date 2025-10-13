const express = require('express');
const router = express.Router();

// {
//   "id": "required: <number>: Ref. CourierOrderRequest.id"
// }

// /private/courier/order-requests/accept/by/id/:id

module.exports = function(App, RPath){

  router.use('', async(req, res)=>{

    try{

      // return App.json( res, true, App.t(['success'], res.lang), {
      //   isAccepted: true,
      //   acceptedAt: App.getISODate(),
      // } );

      const data = req.getPost();
      const mUser = await req.user;
      const mCourier = await req.courier;


      console.debug(`#${res.info.path}: #courier: ${mCourier.id}: order-request: `);

      // sync with (inner-loop)
      await console.sleep(1500);

      const id = req.getCommonDataInt('id', null);
      const statuses = App.getModel('Order').getStatuses();

      if( mCourier.hasActiveOrder || mCourier.activeOrderId )
        return App.json( res, 417, App.t(['you','have','active','order','id',`#${mCourier.activeOrderId}`], req.lang) );

      if( !App.isPosNumber(id) )
        return App.json( res, 417, App.t(['request','id','is-required'], req.lang) );

      const mRequest = await App.getModel('CourierOrderRequest').findOne({
        where: {
          id,
          courierId: mCourier.id,
          isAccepted: false,
          isRejected: false,          
        },
        include: [{
          model: App.getModel('Order'),
          required: true,
          attributes: [
            'id',
            'status',
            'paymentIntentId',
            'clientId',
            'courierId',
            'isPaid', // 'paidAt',
            'isRefunded', // 'refundedAt',
            'isPaymentRequestAllowed', // 'paymentRequestAllowedAt',
            'isPaymentRequested', // 'paymentRequestedAt',
            'isClientActionRequired', // 'clientActionRequiredAt',
          ],
          where: {
            status: statuses['processing'],
            courierId: null,
            isCanceledByClient: false,
            allSuppliersHaveConfirmed: true,
            // paymentIntentId: { [ App.DB.Op.not ]: null },
          },
          include: [
            {
              model: App.getModel('Client'),
              required: true,
              attributes: ['id','userId'],
              include: [{
                model: App.getModel('User'),
                attributes: ['id','firstName','lastName','phone','email'],
              }]
            },
            {
              required: true,
              model: App.getModel('OrderSupplier'),
              attributes: [
                'id','restaurantId',
              ],
            },
            {
              required: true,
              model: App.getModel('OrderPaymentType'),
              attributes: [
                'id','type','paymentCardId',
              ],
            }
          ]
        }]
      });

      if( !App.isObject(mRequest) || !App.isPosNumber(mRequest.id) )
        return App.json( res, 404, App.t(['request','id','not-found'], req.lang) );

      const tx = await App.DB.sequelize.transaction( App.DB.getTxOptions() );

      try{

        const updateOrderRequestRes = await mRequest.update({
          isAccepted: true,
          acceptedAt: App.getISODate(),
        }, {transaction: tx});

        if( !App.isObject(updateOrderRequestRes) || !App.isPosNumber(updateOrderRequestRes.id) ){
          await tx.rollback();
          return App.json( res, false, App.t(['failed-to','accept','request'], req.lang) );
        }

        console.log(`#order: ${mRequest.Order.id}: #courier: ${mCourier.id}: [accepted]: @:${updateOrderRequestRes.acceptedAt}`);

        // order can be already paid if prev. Courier has canceled order after initial confirmation
        if( mRequest.Order.isPaid || mRequest.Order.isPaymentRequested || mRequest.Order.isPaymentRequestAllowed ){
          console.error(` already paid/processing ??`);
          console.warn(`   isPaid:                    ${mRequest.Order.isPaid}`);
          console.warn(`   isPaymentRequestAllowed:   ${mRequest.Order.isPaymentRequestAllowed}`);
          console.warn(`   isPaymentRequested:        ${mRequest.Order.isPaymentRequested}`);
          console.warn(`   isClientActionRequired:    ${mRequest.Order.isClientActionRequired}`);
        }else{

          if( !App.isString(mRequest.Order.paymentIntentId) || !mRequest.Order.paymentIntentId.length ){
            console.debug(` #paymentIntentId: is null => [${mRequest.Order.paymentIntentId}]`);
            console.debug(`   @type:          ${mRequest.Order.OrderPaymentType.type}`);
            console.debug(`   @paymentCardId: ${mRequest.Order.OrderPaymentType.paymentCardId}`);
          }else{

            // "push" order to [auto] payment processing
            const updateOrderActionRes = await mRequest.Order.update({
              isPaymentRequestAllowed: true,
              paymentRequestAllowedAt: App.getISODate(),
            }, {transaction: tx});

            if( !App.isObject(updateOrderActionRes) || !App.isPosNumber(updateOrderActionRes.id) ){
              console.error(` #order: ${mRequest.Order.id}, failed update order [isPaymentRequestAllowed]`);
              await tx.rollback();
              return App.json( res, false, App.t(['failed-to','update','payment','request'], req.lang) );
            }

            console.ok(` #order: ${mRequest.Order.id}: pushed to [auto] payment processing`);
            
          }
          
        }

        await tx.commit();

        console.ok(`#${res.info.path}: #courier: ${mCourier.id}: order-request: accepted: ${updateOrderRequestRes.isAccepted}`);

        await App.json( res, true, App.t(['success'], res.lang), {
          isAccepted: updateOrderRequestRes.isAccepted,
          acceptedAt: updateOrderRequestRes.acceptedAt,
        } );

      }catch(e){
        console.error(`#order: ${mRequest.Order.id}: #courier: ${mCourier.id}: failed: ${e.message}`);
        await tx.rollback();
        return App.json( res, false, App.t(['failed-to','update','request'], req.lang) );
      }

      // [post-process]

      /* const updateCourierRes = */ await mCourier.update({
        totalAcceptedOrders: (mCourier.totalAcceptedOrders + 1),
        // totalCanceledOrders: (mCourier.totalCanceledOrders +1),
      });

    }catch(e){
      console.log(e);
      App.onRouteError( req, res, e );
      // App.json( res, false, App.t('request-could-not-be-processed', req.lang) );
    }

  });

  return { router, method: '', autoDoc:{} };

};

// [short info]
// paymentIntentConfirmRes.data.requiresAction: true || false
// paymentIntentConfirmRes.data.intent: {
//   "id": "pi_3K9BGHLkgFoZ4U2T1LPkzDMy",
//   "object": "payment_intent",
//   "capture_method": "automatic",
//   "client_secret": "pi_3K9BGHLkgFoZ4U2T1LPkzDMy_secret_BoLHXv2Rv68O5WEAAGcZfOH3h",
//   "confirmation_method": "automatic",
//   "created": 1640104345,
//   "currency": "eur",
//   "customer": "cus_KcmMsBW1A2E0nl",
//   "description": "Order: #10000000044",
//   "payment_method": "pm_1JxWpILkgFoZ4U2TkwWw53VZ",
//   "metadata": { "userId": "6", "clientId": "2" },
//   "amount_received": 125,
//   "charges": {
//     "object": "list",
//     "data": [
//       {
//         "id": "ch_3K9BGHLkgFoZ4U2T1Rebx3GC",
//         "object": "charge",
//         "amount": 125,
//         "amount_captured": 125,
//         "amount_refunded": 0,
//         "currency": "eur",
//         "balance_transaction": "txn_3K9BGHLkgFoZ4U2T1FMDaH47",
//         "customer": "cus_KcmMsBW1A2E0nl",
//         "description": "Order: #10000000044",
//         "metadata": { "userId": "6", "clientId": "2" },
//         "paid": true,
//         "payment_intent": "pi_3K9BGHLkgFoZ4U2T1LPkzDMy",
//         "payment_method": "pm_1JxWpILkgFoZ4U2TkwWw53VZ",
//         "payment_method_details": {
//           "card": { "fingerprint": "DVriTDMxd3BsCnK1" }
//         },
//         "receipt_url": "https://pay.stripe.com/receipts/acct_1JwPICLkgFoZ4U2T/ch_3K9BGHLkgFoZ4U2T1Rebx3GC/rcpt_Koous2vHe5p8DDgRF0C8zFEMNDVXnbG",
//         "refunded": false,
//         "refunds": {
//           "url": "/v1/charges/ch_3K9BGHLkgFoZ4U2T1Rebx3GC/refunds"
//         },
//       }
//     ]
//   }
// }

// [long info]
// {
//   "paymentIntentConfirmRes": {
//     "success": true,
//     "message": "The payment is completed",
//     "data": {
//       "requiresAction": false,
//       "intent": {
//         "id": "pi_3K9BGHLkgFoZ4U2T1LPkzDMy",
//         "object": "payment_intent",
//         "amount": 125,
//         "amount_capturable": 0,
//         "amount_received": 125,
//         "application": null,
//         "application_fee_amount": null,
//         "automatic_payment_methods": null,
//         "canceled_at": null,
//         "cancellation_reason": null,
//         "capture_method": "automatic",
//         "charges": {
//           "object": "list",
//           "data": [
//             {
//               "id": "ch_3K9BGHLkgFoZ4U2T1Rebx3GC",
//               "object": "charge",
//               "amount": 125,
//               "amount_captured": 125,
//               "amount_refunded": 0,
//               "application": null,
//               "application_fee": null,
//               "application_fee_amount": null,
//               "balance_transaction": "txn_3K9BGHLkgFoZ4U2T1FMDaH47",
//               "billing_details": {
//                 "address": {
//                   "city": null,
//                   "country": null,
//                   "line1": null,
//                   "line2": null,
//                   "postal_code": null,
//                   "state": null
//                 },
//                 "email": null,
//                 "name": null,
//                 "phone": null
//               },
//               "calculated_statement_descriptor": "NODEJS  DEV",
//               "captured": true,
//               "created": 1640104368,
//               "currency": "eur",
//               "customer": "cus_KcmMsBW1A2E0nl",
//               "description": "Order: #10000000044",
//               "destination": null,
//               "dispute": null,
//               "disputed": false,
//               "failure_code": null,
//               "failure_message": null,
//               "fraud_details": {},
//               "invoice": null,
//               "livemode": false,
//               "metadata": {
//                 "userId": "6",
//                 "clientId": "2"
//               },
//               "on_behalf_of": null,
//               "order": null,
//               "outcome": {
//                 "network_status": "approved_by_network",
//                 "reason": null,
//                 "risk_level": "normal",
//                 "risk_score": 13,
//                 "seller_message": "Payment complete.",
//                 "type": "authorized"
//               },
//               "paid": true,
//               "payment_intent": "pi_3K9BGHLkgFoZ4U2T1LPkzDMy",
//               "payment_method": "pm_1JxWpILkgFoZ4U2TkwWw53VZ",
//               "payment_method_details": {
//                 "card": {
//                   "brand": "visa",
//                   "checks": {
//                     "address_line1_check": null,
//                     "address_postal_code_check": null,
//                     "cvc_check": null
//                   },
//                   "country": "US",
//                   "exp_month": 9,
//                   "exp_year": 2035,
//                   "fingerprint": "DVriTDMxd3BsCnK1",
//                   "funding": "credit",
//                   "installments": null,
//                   "last4": "4242",
//                   "network": "visa",
//                   "three_d_secure": null,
//                   "wallet": null
//                 },
//                 "type": "card"
//               },
//               "receipt_email": "ch3ll0v3k@yandex.com",
//               "receipt_number": null,
//               "receipt_url": "https://pay.stripe.com/receipts/acct_1JwPICLkgFoZ4U2T/ch_3K9BGHLkgFoZ4U2T1Rebx3GC/rcpt_Koous2vHe5p8DDgRF0C8zFEMNDVXnbG",
//               "refunded": false,
//               "refunds": {
//                 "object": "list",
//                 "data": [],
//                 "has_more": false,
//                 "total_count": 0,
//                 "url": "/v1/charges/ch_3K9BGHLkgFoZ4U2T1Rebx3GC/refunds"
//               },
//               "review": null,
//               "shipping": null,
//               "source": null,
//               "source_transfer": null,
//               "statement_descriptor": null,
//               "statement_descriptor_suffix": null,
//               "status": "succeeded",
//               "transfer_data": null,
//               "transfer_group": null
//             }
//           ],
//           "has_more": false,
//           "total_count": 1,
//           "url": "/v1/charges?payment_intent=pi_3K9BGHLkgFoZ4U2T1LPkzDMy"
//         },
//         "client_secret": "pi_3K9BGHLkgFoZ4U2T1LPkzDMy_secret_BoLHXv2Rv68O5WEAAGcZfOH3h",
//         "confirmation_method": "automatic",
//         "created": 1640104345,
//         "currency": "eur",
//         "customer": "cus_KcmMsBW1A2E0nl",
//         "description": "Order: #10000000044",
//         "invoice": null,
//         "last_payment_error": null,
//         "livemode": false,
//         "metadata": {
//           "userId": "6",
//           "clientId": "2"
//         },
//         "next_action": null,
//         "on_behalf_of": null,
//         "payment_method": "pm_1JxWpILkgFoZ4U2TkwWw53VZ",
//         "payment_method_options": {
//           "card": {
//             "installments": null,
//             "network": null,
//             "request_three_d_secure": "automatic"
//           }
//         },
//         "payment_method_types": [
//           "card"
//         ],
//         "processing": null,
//         "receipt_email": "ch3ll0v3k@yandex.com",
//         "review": null,
//         "setup_future_usage": null,
//         "shipping": null,
//         "source": null,
//         "statement_descriptor": null,
//         "statement_descriptor_suffix": null,
//         "status": "succeeded",
//         "transfer_data": null,
//         "transfer_group": null
//       }
//     }
//   }
// }
