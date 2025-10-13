const express = require('express');
const router = express.Router();

// /private/client/orders/get/last/order

module.exports = function(App, RPath){

  router.use('', async(req, res)=>{

    try{

      const data = req.getPost();
      const mUser = await req.user;
      const mClient = await req.client;
      const statuses = App.getModel('Order').getStatuses();

      const mOrder = await App.getModel('Order').findOne({
        where: {
          clientId: mClient.id,
          status: {
            [ App.DB.Op.not ]: statuses.created
          }
        }, 
        attributes: [
          'id','status','totalPrice','finalPrice','deliveryPrice',
          'isOrderRatedByClient','orderRatedByClientAt',
          'createdAt',
          'isValidChecksum','checksum',
          ...App.getModel('Order').getChecksumKeys(),
        ],
        order: [['id','desc']],
        include: [
          {
            model: App.getModel('OrderSupplier'),
            attributes: [
              'id',
              'totalPrice', 'totalItems',
              'isTakenByCourier', // 'takenByCourierAt',
              'isCanceledByRestaurant', 'cancellationReason', // 'canceledByRestaurantAt',
              'isAcceptedByRestaurant', // 'acceptedByRestaurantAt',
              'isOrderReady', // 'orderReadyAt',
              'isOrderDelayed', 
              'orderDelayedFor',
              'isValidChecksum','checksum',
              ...App.getModel('OrderSupplier').getChecksumKeys(),
            ],
            include: [
              {
                model: App.getModel('OrderSupplierItem'),
                attributes: [
                  'id','isRatedByClient','ratedAt','rating','amount',
                ],
                include: [{
                  model: App.getModel('MenuItem'),
                  attributes: [
                    'id','name','image',
                  ]
                }]
              }
            ]
          },
        ]
      });

      if( !App.isObject(mOrder) || !App.isPosNumber(mOrder.id) )
        return App.json( res, 404, App.t(['order','not','found'], res.lang) );

      const data_t = {
        id: mOrder.id,
        totalPrice: mOrder.totalPrice,
        createdAt: mOrder.createdAt,
        items: [],
      };

      if( App.isArray(mOrder.OrderSuppliers) ){
        for( const mOrderSupplier of mOrder.OrderSuppliers ){
          if( !App.isObject(mOrderSupplier) || !App.isPosNumber(mOrderSupplier.id) )
            continue;

          if( App.isArray(mOrderSupplier.OrderSupplierItems) ){
            for( const mOrderSupplierItem of mOrderSupplier.OrderSupplierItems ){
              if( !App.isObject(mOrderSupplierItem) || !App.isPosNumber(mOrderSupplierItem.id) )
                continue;
              data_t.items.push(mOrderSupplierItem.MenuItem);
            }
          }

        }
      }

      // {
      //   "id": 10000000014,
      //   "totalPrice": 2.5,
      //   "OrderSuppliers": [
      //     {
      //       "id": 15,
      //       "OrderSupplierItems": [
      //         {
      //           "id": 23,
      //           "MenuItem": {
      //             "image": "https://aws-s3.morris-armstrong-ii-dev.ru/main/9101ee4446ce7cc232baffab1ba384fd.webp",
      //             "id": 7,
      //             "name": "Fanta"
      //           }
      //         }
      //       ]
      //     }
      //   ]
      // }

      App.json( res, true, App.t(['success'], res.lang), data_t );

    }catch(e){
      console.log(e);
      App.onRouteError( req, res, e );
      // App.json( res, false, App.t('request-could-not-be-processed', req.lang) );
    }

  });

  return { router, method: '', autoDoc:{} };

};


