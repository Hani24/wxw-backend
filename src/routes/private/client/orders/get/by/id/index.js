const express = require('express');
const router = express.Router();

// {
//   "id": "required: <number> Ref. Order.id"
// }

// {
//   "id": 10000000004
// }

// /private/client/orders/get/by/id/

module.exports = function(App, RPath){

  router.use('', async(req, res)=>{

    try{

      const mUser = await req.user;
      const mClient = await req.client;
      const data = req.getPost();
      const id = req.getCommonDataInt('id',null);

      if( App.isNull(id) )
        return App.json( res, 417, App.t(['Order','id','is-required'], req.lang) );

      console.debug({id});

      const statuses = App.getModel('Order').getStatuses();

      const mOrder = await App.getModel('Order').getFullOrderWhere({
        id, // 10000000001
        clientId: mClient.id,
        [ App.DB.Op.and ]: {
          status: {
            [ App.DB.Op.or ]: [
              statuses['created'],
              statuses['processing'],
              statuses['canceled'],
              statuses['delivered'],
              statuses['refunded'],
            ]
          },
        }
      });

      if( !App.isObject(mOrder) || !App.isPosNumber(mOrder.id) )
        return App.json( res, 404, App.t(['Order','id','not-found'], req.lang) );


      console.line();
      for( const timezoneKey of ['allSuppliersHaveConfirmedAt','expectedDeliveryTime'] ){
        console.log(` #${mOrder.id}: tz-server: ${ App.DT.moment( mOrder[ timezoneKey ] ).tz( App.getServerTz() ).format( App.getDateFormat() ) }`);

        mOrder.dataValues[ timezoneKey ] = App.DT.moment( mOrder[ timezoneKey ] )
          .tz( mUser.timezone )
          .format( App.getDateFormat() );

        console.log(` #${mOrder.id}: tz-client: ${ mOrder.dataValues[ timezoneKey ] }`);
      }

      // console.json(mOrder);
      App.json( res, true, App.t('success', res.lang), mOrder);

    }catch(e){
      console.log(e);
      App.onRouteError( req, res, e );
      // App.json( res, false, App.t('request-could-not-be-processed', req.lang) );
    }

  });

  return { router, method: '', autoDoc:{} };

};

// {
//   "id": 10000000088,
//   "courierId": 2,
//   "clientDescription": "",
//   "discountAmount": 0,
//   "discountCode": "",
//   "status": "processing",
//   "totalPrice": 1.25,
//   "deliveryPrice": 0.68,
//   "deliveryPriceUnitPrice": 0.25,
//   "deliveryPriceUnitType": "kilometer",
//   "finalPrice": 1.93,
//   "totalItems": 1,
//   "isDeliveredByCourier": false,
//   "deliveredByCourierAt": null,
//   "isCourierRatedByClient": false,
//   "courierRatedByClientAt": null,
//   "courierRating": 0,
//   "isOrderRatedByClient": false,
//   "orderRatedByClientAt": null,
//   "isRejectedByClient": false,
//   "rejectedByClientAt": null,
//   "rejectionReason": "",
//   "isCanceledByClient": false,
//   "canceledByClientAt": null,
//   "cancellationReason": "",
//   "allSuppliersHaveConfirmed": true,
//   "allSuppliersHaveConfirmedAt": "2022-01-16T22:51:31.000Z",
//   "paymentIntentId": "pi_3KIhZNLkgFoZ4U2T0XWMca4U",
//   "isPaid": true,
//   "paidAt": null,
//   "isClientActionRequired": true,
//   "clientActionRequiredAt": "2022-01-16T22:51:47.000Z",
//   "isClientActionExecuted": false,
//   "clientActionExecutedAt": null,
//   "isLocked": false,
//   "lockedAt": null,
//   "createdAt": "2022-01-16T22:51:19.000Z",
//   "OrderDeliveryAddress": {
//     "id": 63,
//     "DeliveryAddress": {
//       "id": 12,
//       "label": "home",
//       "city": "new york",
//       "street": "broadway 5",
//       "apartment": "3",
//       "description": ""
//     }
//   },
//   "OrderDeliveryTime": {
//     "id": 65,
//     "deliveryDay": "today",
//     "deliveryHour": "now",
//     "deliveryTimeValue": 0,
//     "deliveryTimeType": "NOT-SET"
//   },
//   "OrderDeliveryType": {
//     "id": 85,
//     "type": "Conventional"
//   },
//   "OrderPaymentType": {
//     "id": 63,
//     "type": "Card",
//     "PaymentCard": {
//       "id": 35,
//       "lastDigits": "4242"
//     }
//   },
//   "OrderSuppliers": [
//     {
//       "id": 129,
//       "totalPrice": 1.25,
//       "totalItems": 1,
//       "isTakenByCourier": false,
//       "takenByCourierAt": null,
//       "isCanceledByRestaurant": false,
//       "canceledByRestaurantAt": null,
//       "cancellationReason": "",
//       "isAcceptedByRestaurant": true,
//       "acceptedByRestaurantAt": "2022-01-16T22:51:31.000Z",
//       "isOrderReady": false,
//       "orderReadyAt": null,
//       "isOrderDelayed": false,
//       "orderDelayedFor": 0,
//       "isRestaurantNotified": true,
//       "restaurantNotifiedAt": "2022-01-16T22:51:31.000Z",
//       "isRestaurantAcknowledged": true,
//       "restaurantAcknowledgedAt": "2022-01-16T22:51:31.000Z",
//       "createdAt": "2022-01-16T22:51:19.000Z",
//       "updatedAt": "2022-01-16T22:51:31.000Z",
//       "Restaurant": {
//         "image": "https://aws-s3.morris-armstrong-ii-dev.ru/main/kfc.jpg",
//         "id": 2,
//         "name": "KFC",
//         "description": "description...",
//         "isOpen": true,
//         "rating": 12,
//         "type": "stationary",
//         "lat": 2.9846,
//         "lon": 3.0154,
//         "zip": "123456",
//         "street": "FoorStreet 1123",
//         "cityId": 1234,
//         "City": {
//           "id": 1234,
//           "name": "Miami Beach"
//         }
//       },
//       "OrderSupplierItems": [
//         {
//           "id": 208,
//           "price": 1.25,
//           "amount": 1,
//           "totalPrice": 1.25,
//           "isRatedByClient": false,
//           "ratedAt": null,
//           "rating": 0,
//           "createdAt": "2022-01-16T22:51:19.000Z",
//           "updatedAt": "2022-01-16T22:51:19.000Z",
//           "MenuItem": {
//             "image": "https://aws-s3.morris-armstrong-ii-dev.ru/main/fanta.png",
//             "id": 7,
//             "name": "Fanta",
//             "description": "string",
//             "order": 0,
//             "kcal": 0,
//             "proteins": 0,
//             "fats": 0,
//             "carbs": 0,
//             "price": 1.25,
//             "rating": 0,
//             "createdAt": "2021-10-06T12:09:30.000Z"
//           }
//         }
//       ]
//     }
//   ],
//   "Courier": {
//     "id": 2,
//     "isOnline": true,
//     "lat": 3.00257,
//     "lon": 2.99443,
//     "User": {
//       "id": 6,
//       "firstName": "Slavikus",
//       "lastName": "Timoschenko"
//     }
//   }
// }