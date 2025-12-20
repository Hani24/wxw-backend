module.exports = (parent, eventGroupType)=>{

  const mStripePayment = parent;
  const App = parent.App;

  return async ( mEvent )=>{
    try{

      // console.json({mEvent});
      const mObject = mEvent.object;

      const mMetadata = {
        orderId: ( + mObject.metadata.orderId) || null,
        userId: ( + mObject.metadata.userId) || null,
        clientId: ( + mObject.metadata.clientId) || null,
        totalItems: ( + mObject.metadata.totalItems) || null,
        totalPrice: ( + mObject.metadata.totalPrice) || null,
        // For catering and on-site-presence orders, deliveryPrice can be 0
        deliveryPrice: mObject.metadata.deliveryPrice !== undefined ? ( + mObject.metadata.deliveryPrice) : null,
        finalPrice: ( + mObject.amount ), // cents
        // finalPrice: Math.floor( ((+mObject.metadata.finalPrice) || 0) *100 ), // to-cents
      };

      // console.json({mMetadata});
      for( const mKey of Object.keys(mMetadata) ){
        // Allow deliveryPrice to be 0 for catering and on-site-presence orders
        if( mKey === 'deliveryPrice' ){
          if( mMetadata[ mKey ] === null || mMetadata[ mKey ] === undefined ){
            console.error(` #${mMetadata.orderId}: {mMetadata}: mKey: ${mKey} => has not valid data: ${mMetadata[ mKey ]}`);
            return {success: false, message: ['one-of-the','required','keys','is-missing']};
          }
        } else {
          if( App.isNull(mMetadata[ mKey ]) ){
            console.error(` #${mMetadata.orderId}: {mMetadata}: mKey: ${mKey} => has not valid data: ${mMetadata[ mKey ]}`);
            return {success: false, message: ['one-of-the','required','keys','is-missing']};
          }
        }
      }

      const PAYMENT_INTENT = mObject.payment_intent;

      const mOrder = await App.getModel('Order').findOne({
        where: {
          id: mMetadata.orderId,
          paymentIntentId: PAYMENT_INTENT,
          clientId: mMetadata.clientId,
        },
        include: [
          {
            required: true,
            model: App.getModel('Client'),
            attributes: [
              'id',
              'userId',
              'totalSpend',
              'totalOrders',
              'totalRejectedOrders',
              'totalCanceledOrders',
              'totalCompletedOrders',
            ],
            include: [{
              required: true,
              model: App.getModel('User'),
              attributes: ['id'],              
            }]
          },
          {
            required: true,
            model: App.getModel('OrderSupplier'),
            attributes: ['id','restaurantId'],
          },
          // {
          //   required: true,
          //   model: App.getModel('OrderPaymentType'),
          //   attributes: { exclude: ['createdAt','updatedAt'] },
          //   // include: [{
          //   //   required: false, // Can be null; if(GooglePay || ApplePay)
          //   //   model: App.getModel('PaymentCard'),
          //   // }],
          // },
        ],
      });

      if( !App.isObject(mOrder) || !App.isPosNumber(mOrder.id) )
        return{ success: false, message: ` #${mMetadata.id}: Payment-Intent: [${PAYMENT_INTENT}]: is not available in the orders` };

      if( !mOrder.isValidChecksum )
        return {success: false, message: `Order: ${mOrder.id} Security check error`};

      const statuses = App.getModel('Order').getStatuses();
      const orderTypes = App.getModel('Order').getOrderTypes();

      // captured, succeeded, failed, refunded, expired, pending, updated
      switch(mEvent.event){

        case 'succeeded':
        case 'captured': {
          console.debug(` #${mOrder.id}: type: [${mEvent.type}], event: [${mEvent.event}]: {${console.toJson(mMetadata)}}`);

          if( mOrder.isPaid )
            return {success: true, message: ['order',`#${mOrder.id}`,'already','has-been','paid']};

          if(
            (mObject.amount !== mMetadata.finalPrice)
            ||
            (mObject.amount !== mObject.amount_captured)
            // ||
            // (mObject.amount_refunded > 0)
            // e.g.
            //   "amount": 2341,
            //   "amount_captured": 2341,
            //   "amount_refunded": 0,
          ){
            console.error(`#order: ${mOrder.id}: incorrect payment data`);
            console.json({
              mEvent,
              mOrder,
              mMetadata,
            });

            return {success: false, message: ` #${mOrder.id}: incorrect payment data`};
          }

          // For catering and on-site-presence orders, keep status as 'created' until restaurant accepts
          // For regular orders, change to 'processing' immediately
          const isCatering = mOrder.orderType === orderTypes['catering'];
          const isOnSitePresence = mOrder.orderType === orderTypes['on-site-presence'];
          const shouldKeepCreatedStatus = isCatering || isOnSitePresence;

          const updateOrderOnCapturedRes = await mOrder.update({
            // Only change to 'processing' for regular orders
            // Catering and on-site-presence orders stay in 'created' until restaurant accepts
            ...(!shouldKeepCreatedStatus && { status: statuses.processing }),
            isPaid: true,
            paidAt: App.getISODate(),

            isClientActionRequired: false,
            clientActionRequiredAt: null,

            isPaymentRequestAllowed: false,
            paymentRequestAllowedAt: null,

            // reset ???
            // isPaymentRequested: false,
            // paymentRequestedAt: null,
            // clientSecret: null,
            checksum: true,
          });

          if( !App.isObject(updateOrderOnCapturedRes) || !App.isPosNumber(updateOrderOnCapturedRes.id) )
            return {success: false, message: ` #${mOrder.id}: failed to update order [isPaid] status`};

          const emptyClientCartRes = await App.getModel('Cart').emptyByClientId(mOrder.clientId);

          // const paymentSucceededPushRes = await App.getModel('ClientNotification')
          //   .pushToClientById( mOrder.clientId, {
          //     type: App.getModel('ClientNotification').getTypes()['paymentSucceeded'],
          //     title: 'Order payment succeeded.', 
          //     message: 'Thank you!',
          //     data: {
          //       orderId: mOrder.id,
          //     }
          //   });

          // const clientPaidOrderPushRes = await App.getModel('CourierNotification')
          //   .pushToCourierById( mOrder.courierId, {
          //     type: App.getModel('CourierNotification').getTypes()['clientPaidOrder'],
          //     title: 'Order has been confirmed.', 
          //     message: 'Please wait for next notification from the Restaurant',
          //     data: {
          //       orderId: mOrder.id,
          //     }
          //   });

          // [order] can be canceled at the same time
          if( mOrder.status === statuses.processing ){
            const ackTimeout = (10*1000);
            const notifyData = {
              ack: false, // true,
              // event: App.getModel('RestaurantNotification').getEvents()['clientPaidOrder'],
              // type: App.getModel('RestaurantNotification').getTypes()['clientPaidOrder'],
              event: App.getModel('RestaurantNotification').getEvents()['orderHasBeenPaid'],
              type: App.getModel('RestaurantNotification').getTypes()['orderHasBeenPaid'],
              data: {
                orderId: mOrder.id,
                clientId: mOrder.clientId,
                courierId: mOrder.courierId,
              }, 
            };            
  
            for( const mOrderSupplier of mOrder.OrderSuppliers ){
              const notifyRes = await App.getModel('RestaurantNotification')
                .notifyById( mOrderSupplier.restaurantId, notifyData, ackTimeout );
              console.log(` #order: ${mOrder.id}: mOrderSupplier: ${mOrderSupplier.id}: notify: ${notifyRes.message}`);
            }
  
          }

          {

            if( 
              ((mOrder.status !== statuses.processing) || ( mOrder.isCanceledByClient ))
              &&
              ( ! mOrder.isDeliveredByCourier )
              &&
              ( mOrder.isPaymentRequested)
              &&
              ( mOrder.allSuppliersHaveConfirmed)
              &&
              ( ! mOrder.isRefunded)
              // &&
              // ( App.isString(mOrder.paymentIntentId) && mOrder.paymentIntentId.length )
              // &&
              // ( App.isString(mOrder.clientSecret) && mOrder.clientSecret.length )
            ){

              // request [refund] process
              const refundRes = await App.payments.stripe.paymentIntentRefund( mOrder.paymentIntentId, {
                orderId: mOrder.id,
                userId: mOrder.Client.User.id,
                clientId: mOrder.Client.id,
                courierId: mOrder.courierId,
                // restaurantId: mRestaurant.id,
                totalItems: mOrder.totalItems,
                finalPrice: mMetadata.finalPrice, // mOrder.finalPrice,
              });

              console.debug(`refundRes: ${refundRes.message}`);

            }

          }

          // [statistic]
          await mOrder.Client.update({
            totalSpend: (mOrder.Client.totalSpend +(mOrder.finalPrice)),
            // totalSpend: (mOrder.Client.totalSpend -( +(mObject.amount_refunded/100).toFixed(2) )),
            totalOrders: (mOrder.Client.totalOrders +1),
            // totalRejectedOrders: (mOrder.Client.totalRejectedOrders +1),
            // totalCanceledOrders: (mOrder.Client.totalCanceledOrders +1),
            // totalCompletedOrders: (mOrder.Client.totalCompletedOrders +1),
          });

          break;
        }

        case 'refunded':{          
          console.debug(` #${mOrder.id}: type: [${mEvent.type}], event: [${mEvent.event}]: {${console.toJson(mMetadata)}}`);

          if( !mOrder.isPaid )
            return {success: true, message: ['cannot','refund','unpaid','order']};

          if( mOrder.isRefunded )
            return {success: true, message: ['order','already','refunded']};

          if( mObject.refunded ){

            const tx = await App.DB.sequelize.transaction( App.DB.getTxOptions() );

            try{

              const updateOrderOnRefund = await mOrder.update({
                status: statuses.refunded,
                // status: statuses.canceled,
                isRefunded: true,
                refundedAt: App.getISODate(),

                // isClientActionRequired: false,
                // clientActionRequiredAt: null,

                // isPaymentRequestAllowed: false,
                // paymentRequestAllowedAt: null,

                // reset ???
                // isPaymentRequested: false,
                // paymentRequestedAt: null,
                // clientSecret: null,
                // paymentIntentId: null,
                checksum: true,
              }, {trasaction: tx});

              if( !App.isObject(updateOrderOnRefund) || !App.isPosNumber(updateOrderOnRefund.id) ){
                await tx.rollback();
                return {success: false, message: ` #${mOrder.id}: failed to update order [isRefunded:true] status`};
              }

              // [statistic]
              const updateClient = await mOrder.Client.update({
                // totalSpend: (mOrder.Client.totalSpend +(mOrder.finalPrice)),
                totalSpend: (mOrder.Client.totalSpend -( +(mObject.amount_refunded/100).toFixed(2) )),
                // totalOrders: (mOrder.Client.totalOrders +1),
                // totalRejectedOrders: (mOrder.Client.totalRejectedOrders +1),
                totalCanceledOrders: (mOrder.Client.totalCanceledOrders +1),
                // totalCompletedOrders: (mOrder.Client.totalCompletedOrders +1),
              }, {trasaction: tx});

              if( !App.isObject(updateClient) || !App.isPosNumber(updateClient.id) ){
                await tx.rollback();
                return {success: false, message: ` #${mOrder.id}: failed to update client`};
              }

              await tx.commit();

            }catch(e){
              console.log(e);
              await tx.rollback();
              return {success: false, message: ` #${mOrder.id}: failed to update order on(event): [refunded]`};
            }

            const pushToClientRes = await App.getModel('ClientNotification')
              .pushToClientById( mOrder.clientId, {
                type: App.getModel('ClientNotification').getTypes()['orderRefunded'],
                title: `Order #${mOrder.id}`,
                message: App.t(['order','has-been','refunded']),
                data: {
                  orderId: mOrder.id,
                }
              });

            if( !pushToClientRes.success )
              console.error(`pushToClientRes: ${pushToClientRes.message}`);

          }
          break;
        }

        case 'pending':{
          console.debug(` #${mOrder.id}: type: [${mEvent.type}], event: [${mEvent.event}]: {${console.toJson(mMetadata)}}`);
          break;
        }

        case 'updated':{
          console.debug(` #${mOrder.id}: type: [${mEvent.type}], event: [${mEvent.event}]: {${console.toJson(mMetadata)}}`);
          break;
        }

        case 'expired':{

          const startDate = new Date( mOrder.createdAt );
          const endDate = new Date();
          const timeDiff_t = Math.floor((endDate - startDate) /1000);
          const minutes = +(timeDiff_t /60).toFixed(2);

          console.error(` #${mOrder.id} EXPIRED: timeDiff_t: ${timeDiff_t}, minutes: ${minutes}`);
          console.debug(` #${mOrder.id}: type: [${mEvent.type}], event: [${mEvent.event}]: {${console.toJson(mMetadata)}}`);
          break;
        }

        case 'failed':{
          console.debug(` #${mOrder.id}: type: [${mEvent.type}], event: [${mEvent.event}]: {${console.toJson(mMetadata)}}`);
          break;
        }

        default:{
          return {success: false, message: ['unsupported','event']};
        }

      }

      return {success: true, message: ['event',mEvent.event,'of-type',mEvent.type,'has-been','processed']};

    }catch(e){
      console.error(` #${mStripePayment.name}:[h]:${eventGroupType}: ${e.message}`);
      console.error(e);
      return {success: false, message: ['failed-to','handle',eventGroupType,'event']};
    }
  }

}


// [14:31:56][L] : [post, https, US, 54.187.205.235, api.3dmadcat.ru] [/public/services/stripe/web-hook/ : {}]
// [14:31:56][D] :  @hook: type: charge, event: succeeded
// [14:31:56][L] : {
// [14:31:56][L] :   "mEvent": {
// [14:31:56][L] :     "type": "charge",
// [14:31:56][L] :     "event": "succeeded",
// [14:31:56][L] :     "object": {
// [14:31:56][L] :       "id": "ch_3KGkRjLkgFoZ4U2T1osws2yk",
// [14:31:56][L] :       "object": "charge",
// [14:31:56][L] :       "amount": 405,
// [14:31:56][L] :       "amount_captured": 405,
// [14:31:56][L] :       "amount_refunded": 0,
// [14:31:56][L] :       "application": null,
// [14:31:56][L] :       "application_fee": null,
// [14:31:56][L] :       "application_fee_amount": null,
// [14:31:56][L] :       "balance_transaction": "txn_3KGkRjLkgFoZ4U2T1XjskdxX",
// [14:31:56][L] :       "billing_details": {
// [14:31:56][L] :         "address": {
// [14:31:56][L] :           "city": null,
// [14:31:56][L] :           "country": null,
// [14:31:56][L] :           "line1": null,
// [14:31:56][L] :           "line2": null,
// [14:31:56][L] :           "postal_code": null,
// [14:31:56][L] :           "state": null
// [14:31:56][L] :         },
// [14:31:56][L] :         "email": null,
// [14:31:56][L] :         "name": null,
// [14:31:56][L] :         "phone": null
// [14:31:56][L] :       },
// [14:31:56][L] :       "calculated_statement_descriptor": "NODEJS  DEV",
// [14:31:56][L] :       "captured": true,
// [14:31:56][L] :       "created": 1641907914,
// [14:31:56][L] :       "currency": "eur",
// [14:31:56][L] :       "customer": "cus_KcmMsBW1A2E0nl",
// [14:31:56][L] :       "description": "Order: #10000000084",
// [14:31:56][L] :       "destination": null,
// [14:31:56][L] :       "dispute": null,
// [14:31:56][L] :       "disputed": false,
// [14:31:56][L] :       "failure_code": null,
// [14:31:56][L] :       "failure_message": null,
// [14:31:56][L] :       "fraud_details": {},
// [14:31:56][L] :       "invoice": null,
// [14:31:56][L] :       "livemode": false,
// [14:31:56][L] :       "metadata": {
// [14:31:56][L] :         "orderId": "10000000084",
// [14:31:56][L] :         "userId": "6",
// [14:31:56][L] :         "clientId": "2",
// [14:31:56][L] :         "totalItems": "2",
// [14:31:56][L] :         "totalPrice": "3.37",
// [14:31:56][L] :         "deliveryPrice": "0.68",
// [14:31:56][L] :         "finalPrice": "4.05"
// [14:31:56][L] :       },
// [14:31:56][L] :       "on_behalf_of": null,
// [14:31:56][L] :       "order": null,
// [14:31:56][L] :       "outcome": {
// [14:31:56][L] :         "network_status": "approved_by_network",
// [14:31:56][L] :         "reason": null,
// [14:31:56][L] :         "risk_level": "normal",
// [14:31:56][L] :         "risk_score": 60,
// [14:31:56][L] :         "seller_message": "Payment complete.",
// [14:31:56][L] :         "type": "authorized"
// [14:31:56][L] :       },
// [14:31:56][L] :       "paid": true,
// [14:31:56][L] :       "payment_intent": "pi_3KGkRjLkgFoZ4U2T1Oy76uvP",
// [14:31:56][L] :       "payment_method": "pm_1JxWpILkgFoZ4U2TkwWw53VZ",
// [14:31:56][L] :       "payment_method_details": {
// [14:31:56][L] :         "card": {
// [14:31:56][L] :           "brand": "visa",
// [14:31:56][L] :           "checks": {
// [14:31:56][L] :             "address_line1_check": null,
// [14:31:56][L] :             "address_postal_code_check": null,
// [14:31:56][L] :             "cvc_check": null
// [14:31:56][L] :           },
// [14:31:56][L] :           "country": "US",
// [14:31:56][L] :           "exp_month": 9,
// [14:31:56][L] :           "exp_year": 2035,
// [14:31:56][L] :           "fingerprint": "DVriTDMxd3BsCnK1",
// [14:31:56][L] :           "funding": "credit",
// [14:31:56][L] :           "installments": null,
// [14:31:56][L] :           "last4": "4242",
// [14:31:56][L] :           "network": "visa",
// [14:31:56][L] :           "three_d_secure": null,
// [14:31:56][L] :           "wallet": null
// [14:31:56][L] :         },
// [14:31:56][L] :         "type": "card"
// [14:31:56][L] :       },
// [14:31:56][L] :       "receipt_email": "ch3ll0v3k@yandex.com",
// [14:31:56][L] :       "receipt_number": null,
// [14:31:56][L] :       "receipt_url": "https://pay.stripe.com/receipts/acct_1JwPICLkgFoZ4U2T/ch_3KGkRjLkgFoZ4U2T1osws2yk/rcpt_Kwdj05xufe5skfIqlnWwo9uAAw53LvA",
// [14:31:56][L] :       "refunded": false,
// [14:31:56][L] :       "refunds": {
// [14:31:56][L] :         "object": "list",
// [14:31:56][L] :         "data": [],
// [14:31:56][L] :         "has_more": false,
// [14:31:56][L] :         "total_count": 0,
// [14:31:56][L] :         "url": "/v1/charges/ch_3KGkRjLkgFoZ4U2T1osws2yk/refunds"
// [14:31:56][L] :       },
// [14:31:56][L] :       "review": null,
// [14:31:56][L] :       "shipping": null,
// [14:31:56][L] :       "source": null,
// [14:31:56][L] :       "source_transfer": null,
// [14:31:56][L] :       "statement_descriptor": null,
// [14:31:56][L] :       "statement_descriptor_suffix": null,
// [14:31:56][L] :       "status": "succeeded",
// [14:31:56][L] :       "transfer_data": null,
// [14:31:56][L] :       "transfer_group": null
// [14:31:56][L] :     }
// [14:31:56][L] :   }
// [14:31:56][L] : }


// refund
// [12:51:42][L] : {
// [12:51:42][L] :   "mEvent": {
// [12:51:42][L] :     "type": "charge",
// [12:51:42][L] :     "event": "refunded",
// [12:51:42][L] :     "object": {
// [12:51:42][L] :       "id": "ch_3KM4hlLkgFoZ4U2T1K0a5cPl",
// [12:51:42][L] :       "object": "charge",
// [12:51:42][L] :       "amount": 1422,
// [12:51:42][L] :       "amount_captured": 1422,
// [12:51:42][L] :       "amount_refunded": 1422,
// [12:51:42][L] :       "application": null,
// [12:51:42][L] :       "application_fee": null,
// [12:51:42][L] :       "application_fee_amount": null,
// [12:51:42][L] :       "balance_transaction": "txn_3KM4hlLkgFoZ4U2T1d3062XA",
// [12:51:42][L] :       "billing_details": {
// [12:51:42][L] :         "address": {
// [12:51:42][L] :           "city": null,
// [12:51:42][L] :           "country": null,
// [12:51:42][L] :           "line1": null,
// [12:51:42][L] :           "line2": null,
// [12:51:42][L] :           "postal_code": null,
// [12:51:42][L] :           "state": null
// [12:51:42][L] :         },
// [12:51:42][L] :         "email": null,
// [12:51:42][L] :         "name": null,
// [12:51:42][L] :         "phone": null
// [12:51:42][L] :       },
// [12:51:42][L] :       "calculated_statement_descriptor": "NODEJS  DEV",
// [12:51:42][L] :       "captured": true,
// [12:51:42][L] :       "created": 1643177424,
// [12:51:42][L] :       "currency": "eur",
// [12:51:42][L] :       "customer": "cus_KcmMsBW1A2E0nl",
// [12:51:42][L] :       "description": "Order: #10000000145",
// [12:51:42][L] :       "destination": null,
// [12:51:42][L] :       "dispute": null,
// [12:51:42][L] :       "disputed": false,
// [12:51:42][L] :       "failure_code": null,
// [12:51:42][L] :       "failure_message": null,
// [12:51:42][L] :       "fraud_details": {},
// [12:51:42][L] :       "invoice": null,
// [12:51:42][L] :       "livemode": false,
// [12:51:42][L] :       "metadata": {
// [12:51:42][L] :         "orderId": "10000000145",
// [12:51:42][L] :         "userId": "6",
// [12:51:42][L] :         "clientId": "2",
// [12:51:42][L] :         "totalItems": "4",
// [12:51:42][L] :         "totalPrice": "9.61",
// [12:51:42][L] :         "deliveryPrice": "4.61",
// [12:51:42][L] :         "finalPrice": "14.22"
// [12:51:42][L] :       },
// [12:51:42][L] :       "on_behalf_of": null,
// [12:51:42][L] :       "order": null,
// [12:51:42][L] :       "outcome": {
// [12:51:42][L] :         "network_status": "approved_by_network",
// [12:51:42][L] :         "reason": null,
// [12:51:42][L] :         "risk_level": "normal",
// [12:51:42][L] :         "risk_score": 55,
// [12:51:42][L] :         "seller_message": "Payment complete.",
// [12:51:42][L] :         "type": "authorized"
// [12:51:42][L] :       },
// [12:51:42][L] :       "paid": true,
// [12:51:42][L] :       "payment_intent": "pi_3KM4hlLkgFoZ4U2T1NORScnI",
// [12:51:42][L] :       "payment_method": "pm_1JxWpILkgFoZ4U2TkwWw53VZ",
// [12:51:42][L] :       "payment_method_details": {
// [12:51:42][L] :         "card": {
// [12:51:42][L] :           "brand": "visa",
// [12:51:42][L] :           "checks": {
// [12:51:42][L] :             "address_line1_check": null,
// [12:51:42][L] :             "address_postal_code_check": null,
// [12:51:42][L] :             "cvc_check": null
// [12:51:42][L] :           },
// [12:51:42][L] :           "country": "US",
// [12:51:42][L] :           "exp_month": 9,
// [12:51:42][L] :           "exp_year": 2035,
// [12:51:42][L] :           "fingerprint": "DVriTDMxd3BsCnK1",
// [12:51:42][L] :           "funding": "credit",
// [12:51:42][L] :           "installments": null,
// [12:51:42][L] :           "last4": "4242",
// [12:51:42][L] :           "network": "visa",
// [12:51:42][L] :           "three_d_secure": null,
// [12:51:42][L] :           "wallet": null
// [12:51:42][L] :         },
// [12:51:42][L] :         "type": "card"
// [12:51:42][L] :       },
// [12:51:42][L] :       "receipt_email": "ch3ll0v3k@yandex.com",
// [12:51:42][L] :       "receipt_number": null,
// [12:51:42][L] :       "receipt_url": "https://pay.stripe.com/receipts/acct_1JwPICLkgFoZ4U2T/ch_3KM4hlLkgFoZ4U2T1K0a5cPl/rcpt_L290JwGTtGNwxt5jts75nVaSzwAFbxS",
// [12:51:42][L] :       "refunded": true,
// [12:51:42][L] :       "refunds": {
// [12:51:42][L] :         "object": "list",
// [12:51:42][L] :         "data": [
// [12:51:42][L] :           {
// [12:51:42][L] :             "id": "re_3KM4hlLkgFoZ4U2T16Fg4Nkc",
// [12:51:42][L] :             "object": "refund",
// [12:51:42][L] :             "amount": 1422,
// [12:51:42][L] :             "balance_transaction": "txn_3KM4hlLkgFoZ4U2T1rJGuAiV",
// [12:51:42][L] :             "charge": "ch_3KM4hlLkgFoZ4U2T1K0a5cPl",
// [12:51:42][L] :             "created": 1643716301,
// [12:51:42][L] :             "currency": "eur",
// [12:51:42][L] :             "metadata": {
// [12:51:42][L] :               "orderId": "124",
// [12:51:42][L] :               "userId": "124",
// [12:51:42][L] :               "clientId": "543"
// [12:51:42][L] :             },
// [12:51:42][L] :             "payment_intent": "pi_3KM4hlLkgFoZ4U2T1NORScnI",
// [12:51:42][L] :             "reason": null,
// [12:51:42][L] :             "receipt_number": null,
// [12:51:42][L] :             "source_transfer_reversal": null,
// [12:51:42][L] :             "status": "succeeded",
// [12:51:42][L] :             "transfer_reversal": null
// [12:51:42][L] :           }
// [12:51:42][L] :         ],
// [12:51:42][L] :         "has_more": false,
// [12:51:42][L] :         "total_count": 1,
// [12:51:42][L] :         "url": "/v1/charges/ch_3KM4hlLkgFoZ4U2T1K0a5cPl/refunds"
// [12:51:42][L] :       },
// [12:51:42][L] :       "review": null,
// [12:51:42][L] :       "shipping": null,
// [12:51:42][L] :       "source": null,
// [12:51:42][L] :       "source_transfer": null,
// [12:51:42][L] :       "statement_descriptor": null,
// [12:51:42][L] :       "statement_descriptor_suffix": null,
// [12:51:42][L] :       "status": "succeeded",
// [12:51:42][L] :       "transfer_data": null,
// [12:51:42][L] :       "transfer_group": null
// [12:51:42][L] :     }
// [12:51:42][L] :   }
// [12:51:42][L] : }
