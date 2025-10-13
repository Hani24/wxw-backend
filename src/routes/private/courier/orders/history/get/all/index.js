const express = require('express');
const router = express.Router();

// /private/courier/orders/history/get/all

module.exports = function(App, RPath){

  router.use('', async(req, res)=>{

    try{

      const data = req.getPost();
      const mUser = await req.user;
      const mCourier = await req.courier;

      const {offset, limit, order, by} = req.getPagination({});
      const orderBy = App.getModel('CourierOrderRequest').getOrderBy(by);
      const statuses = App.getModel('Order').getStatuses();

      const mCourierOrderRequests = await App.getModel('CourierOrderRequest').findAndCountAll({
        where: {
          // status: { [ App.DB.Op.not ]: statuses.created },
          courierId: mCourier.id,
          isAccepted: true,
          isRejected: false,
        },
        distinct: true,
        attributes: [
          'id','orderId','isAccepted','acceptedAt','isRejected','rejectedAt','createdAt',
        ],
        include: [{
          model: App.getModel('Order'),
          attributes: [
            'id','status','clientDescription','totalItems',
            'isDeliveredByCourier','deliveredByCourierAt',
            'isRejectedByClient','rejectedByClientAt',
            'isCanceledByClient','canceledByClientAt','cancellationReason',
            'deliveryPrice', // 'deliveryPriceUnitPrice','deliveryPriceUnitType',
          ],
          include: [
            {
              model: App.getModel('OrderDeliveryTime'),
              attributes: [
                'id','deliveryDay','deliveryHour','deliveryTimeValue','deliveryTimeType'
              ],
            },
            {
              model: App.getModel('OrderSupplier'),
              attributes: ['id'],
              include: [
                {
                  model: App.getModel('Restaurant'),
                  attributes: [
                    'id','name','image','description','zip','street','type','lat','lon'
                  ],
                },
                // {
                //   model: App.getModel('OrderSupplierItem'),
                //   attributes: ['id','amount'],
                //   include: [{
                //     model: App.getModel('MenuItem'),
                //     attributes: ['id','name','image']
                //   }]
                // },
              ],
            },
            // {
            //   model: App.getModel('Client'),
            //   attributes: ['id','lat','lon'],
            //   include: [{
            //     model: App.getModel('User'),
            //     attributes: ['id','firstName','lastName','image','phone'],
            //   }]
            // },
          ],
        }],
        offset,
        limit,
        order: [[ orderBy, order ]]
      });

      const data_t = {
        count: mCourierOrderRequests.count,
        rows: [],
      };

      for( const mCourierOrderRequest of mCourierOrderRequests.rows ){

        if( !App.isObject(mCourierOrderRequest) || !App.isPosNumber(mCourierOrderRequest.id) )
          continue;

        const mOrder = mCourierOrderRequest.Order;
        if( !App.isObject(mOrder) || !App.isPosNumber(mOrder.id) )
          continue;

        const mOrderDeliveryTime = mOrder.OrderDeliveryTime;
        if( !App.isObject(mOrderDeliveryTime) || !App.isPosNumber(mOrderDeliveryTime.id) )
          continue;

        const item_t = {
          order: {
            id: mOrder.id,
            status: mOrder.status,
            clientDescription: mOrder.clientDescription,
            totalItems: mOrder.totalItems,
            isDeliveredByCourier: mOrder.isDeliveredByCourier,
            deliveredByCourierAt: mOrder.deliveredByCourierAt,
            isRejectedByClient: mOrder.isRejectedByClient,
            rejectedByClientAt: mOrder.rejectedByClientAt,
            isCanceledByClient: mOrder.isCanceledByClient,
            canceledByClientAt: mOrder.canceledByClientAt,
            cancellationReason: mOrder.cancellationReason,
          },
          request: {
            id: mCourierOrderRequest.id,
            isAccepted: mCourierOrderRequest.isAccepted,
            isRejected: mCourierOrderRequest.isRejected,
          },
          // client: {
          //   id: mClient.id,
          //   firstName: mClient.User.firstName,
          //   lastName: mClient.User.lastName,
          //   image: mClient.User.image,
          //   phone: mClient.User.phone,
          //   distance: 0,
          //   units: '',
          // },
          deliveryTime: {
            day: mOrderDeliveryTime.deliveryDay,
            hour: mOrderDeliveryTime.deliveryHour,
            value: mOrderDeliveryTime.deliveryTimeValue,
            type: mOrderDeliveryTime.deliveryTimeType,
          },
          income: {
            // '// NOTE': 'this will change: ...',
            amount: mOrder.deliveryPrice,
            code: 'USD',
            symbol: '$',
          },
          suppliers: [],
        };

        if( App.isArray(mOrder.OrderSuppliers) )
        for( const mOrderSupplier of mOrder.OrderSuppliers ){

          const mRestaurant = mOrderSupplier.Restaurant;
          if( !App.isObject(mRestaurant) || !App.isPosNumber(mRestaurant.id) )
            continue;

          item_t.suppliers.push({
            id: mRestaurant.id,
            name: mRestaurant.name,
            type: mRestaurant.type,
            image: mRestaurant.image,
            description: mRestaurant.description,
            street: mRestaurant.street,
            zip: mRestaurant.zip,
            lat: mRestaurant.lat,
            lon: mRestaurant.lon,
          });

        }

        data_t.rows.push( item_t );

      }

      App.json( res, true, App.t(['success'], res.lang), data_t );

    }catch(e){
      console.log(e);
      App.onRouteError( req, res, e );
      // App.json( res, false, App.t('request-could-not-be-processed', req.lang) );
    }

  });

  return { router, method: '', autoDoc:{} };

};


