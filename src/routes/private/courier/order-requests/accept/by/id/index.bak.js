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

      const id = req.getCommonDataInt('id', null);
      const statuses = App.getModel('Order').getStatuses();

      if( mCourier.hasActiveOrder || mCourier.activeOrderId )
        return App.json( res, 417, App.t(['you','have','active','order','id',`#${mCourier.activeOrderId}`], req.lang) );

      if( App.isNull(id) )
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
            'id','status','paymentIntentId','clientId','courierId',
            'isPaid', // 'paidAt',
            'isPaymentRequestAllowed', // 'paymentRequestAllowedAt',
            'isPaymentRequested', // 'paymentRequestedAt',
          ],
          where: {
            status: statuses['processing'],
            courierId: null,
          },
          include: [
            {
              model: App.getModel('Client'),
              attributes: ['id','userId'],
              required: true,
              include: [{
                model: App.getModel('User'),
                attributes: ['id','firstName','lastName','phone','email'],
              }]
            },
            {
              model: App.getModel('OrderSupplier'),
              required: true,
              attributes: [
                'id','restaurantId',
              ],
            }
          ]
        }]
      });

      if( !App.isObject(mRequest) || !App.isPosNumber(mRequest.id) )
        return App.json( res, 404, App.t(['request','id','not-found'], req.lang) );

      const updateRequestRes = await mRequest.update({
        isAccepted: true,
        acceptedAt: App.getISODate(),
      });
      console.json({updateRequestRes});
      if( !App.isObject(updateRequestRes) || !App.isPosNumber(updateRequestRes.id) )
        return App.json( res, 417, App.t(['failed-to','accept','request'], req.lang) );

      // const updateOrderRes = await mRequest.Order.update({
      //   courierId: mCourier.id,
      // });
      // console.json({updateOrderRes});
      // if( !App.isObject(updateOrderRes) || !App.isPosNumber(updateOrderRes.id) )
      //   return App.json( res, 417, App.t(['failed-to','assign','courier'], req.lang) );

      // const updateCourierRes = await mCourier.update({
      //   hasActiveOrder: true,
      //   activeOrderAt: App.getISODate(),
      //   activeOrderId: mRequest.Order.id,
      // });
      // console.json({updateCourierRes});
      // if( !App.isObject(updateCourierRes) || !App.isPosNumber(updateCourierRes.id) )
      //   return App.json( res, 417, App.t(['failed-to','update','courier','info'], req.lang) );

      // const tx = await App.DB.sequelize.transaction( App.DB.getTxOptions() );
      // try{
      //   try{
      //     console.log(`#order: ${mRequest.Order.id}: #courier: ${mCourier.id}`);
      //     await [Model].update({
      //       // ...
      //     }, { transaction: tx });
      //   }catch(e){}
      // }catch(e){}

      // sync with (inner-loop)
      await console.sleep(2000);

      await App.json( res, true, App.t(['success'], res.lang), {
        isAccepted: updateRequestRes.isAccepted,
        acceptedAt: updateRequestRes.acceptedAt,
      } );

      // [post-process]

      // order can be already paid if prev. Courier has canceled order after initial confirmation
      if( !mRequest.Order.isPaid ){

        const mOrderPaymentType = await App.getModel('OrderPaymentType').findOne({
          where: { orderId: mRequest.Order.id }
        });

        if( !App.isObject(mOrderPaymentType) || !App.isPosNumber(mOrderPaymentType.id) ){
          console.error(` failed to get OrderPaymentType`);
          console.json({mRequest});
          return;
        }

        if( App.isNull(mRequest.Order.paymentIntentId) ){
          console.debug(` #paymentIntentId: is null => ApplePay || GooglePay ???`);
          console.debug(`  @type: ${mOrderPaymentType.type}`);
          console.debug(`  @paymentCardId: ${mOrderPaymentType.paymentCardId}`);
          return;
        }

        const paymentIntentConfirmRes = await App.payments.stripe.paymentIntentConfirm( mRequest.Order.paymentIntentId );
        if( paymentIntentConfirmRes.data.requiresAction ){
          const updateOrderActionRes = await mRequest.Order.update({
            isClientActionRequired: true,
            clientActionRequiredAt: App.getISODate(),
          });
          // console.debug({updateOrderActionRes});

          if( !App.isObject(updateOrderActionRes) || !App.isPosNumber(updateOrderActionRes.id) ){
            console.error(` #failed update order: ${mRequest.Order.id}`);
            return;
          }

          const paymentActionRequiredPushRes = await App.getModel('ClientNotification')
            .pushToClient( mRequest.Order.Client, {
              type: App.getModel('ClientNotification').getTypes()['paymentActionRequired'],
              title: 'Order payment.', 
              message: 'Your action is required',
              data: {
                orderId: mRequest.Order.id,
              }
            });
          console.json({paymentActionRequiredPushRes});
        }

        if( !paymentIntentConfirmRes.success ){
          console.error(` #stripe: paymentIntentConfirmRes: ${paymentIntentConfirmRes.message}`);
          console.json({paymentIntentConfirmRes});
          return;
        }

        console.ok(` #stripe: paymentIntentConfirmRes: ${paymentIntentConfirmRes.message}`);

        const emptyClientCartRes = await App.getModel('Cart').emptyByClientId(mRequest.Order.Client.id);
        console.json({emptyClientCartRes});

        // const paymentSucceededPushRes = await App.getModel('ClientNotification')
        //   .pushToClient( mRequest.Order.Client, {
        //     type: App.getModel('ClientNotification').getTypes()['paymentSucceeded'],
        //     title: 'Order payment Succeeded', 
        //     message: 'Thank you!',
        //     data: {
        //       orderId: mRequest.Order.id,
        //     }
        //   });
        // console.json({paymentSucceededPushRes});

        const clientPaidOrderPushRes = await App.getModel('CourierNotification')
          .pushToCourier( mCourier, {
            type: App.getModel('CourierNotification').getTypes()['clientPaidOrder'],
            title: 'Order has been confirmed.', 
            message: 'Please wait for next notification from the Restaurant',
            data: {
              orderId: mRequest.Order.id,
            }
          });
        console.json({clientPaidOrderPushRes});

        const ackTimeout = (10*1000);
        const notifyData = {
          ack: true,
          // event: App.getModel('RestaurantNotification').getEvents()['clientPaidOrder'],
          // type: App.getModel('RestaurantNotification').getTypes()['clientPaidOrder'],
          event: App.getModel('RestaurantNotification').getEvents()['orderHasBeenPaid'],
          type: App.getModel('RestaurantNotification').getTypes()['orderHasBeenPaid'],
          data: {
            orderId: mRequest.Order.id,
            clientId: mRequest.Order.Client.id,
            courierId: mCourier.id,
          }, 
        };

        for( const mOrderSupplier of mRequest.Order.OrderSuppliers ){
          const notifyRes = await App.getModel('RestaurantNotification')
            .notifyById( mOrderSupplier.restaurantId, notifyData, ackTimeout );
          console.log(` #order: ${mRequest.Order.id} => mOrderSupplier: ${mOrderSupplier.id}: notify: ${notifyRes.message}`);
        }

      } // else: paid

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
