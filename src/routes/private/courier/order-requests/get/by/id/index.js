const express = require('express');
const router = express.Router();

// {
//   "id": "required: <number>: Ref. CourierOrderRequest.id"
// }

// /private/courier/order-requests/get/by/id/:id

module.exports = function(App, RPath){

  router.use('', async(req, res)=>{

    try{

      const data = req.getPost();
      const mUser = await req.user;
      const mCourier = await req.courier;
      const id = req.getCommonDataInt('id',null);
      const statuses = App.getModel('Order').getStatuses();

      if( App.isNull(id) )
        return App.json( res, 417, App.t(['Request id is required'], req.lang) );

      const mRequest = await App.getModel('CourierOrderRequest').findOne({
        where: {
          id,
          courierId: mCourier.id,          
          // isAccepted: false,
          // isRejected: false,
        },
        attributes: [
          'id',
        ],
        include: [{
          model: App.getModel('Order'),
          required: true,
          attributes: [
            'id','status','clientDescription','totalItems', 'deliveryPrice', 
            'isPaid', 'paidAt',
            // 'deliveryPriceUnitPrice','deliveryPriceUnitType'
          ],
          where: {
            status: statuses['processing'],
            courierId: null,
            // courierId: {
            //   [ App.DB.Op.not ]: null
            // }
          },
          include: [
            {
              model: App.getModel('OrderDeliveryAddress'),
              attributes: ['id'],
              include: [{
                model: App.getModel('DeliveryAddress'),
                attributes: [
                  // 'id',
                  // 'label',
                  'city','street','apartment','description','lat','lon'
                ],
              }]
            },
            {
              model: App.getModel('OrderDeliveryTime'),
              attributes: [
                'id','deliveryDay','deliveryHour','deliveryTimeValue','deliveryTimeType'
              ],
            },
            {
              model: App.getModel('OrderDeliveryType'),
              attributes: [ 'id','type' ],
            },
            {
              model: App.getModel('Client'),
              attributes: ['id','lat','lon'],
              include: [{
                model: App.getModel('User'),
                attributes: ['id','firstName','lastName','image','phone'],
              }]
            },
            {
              model: App.getModel('OrderSupplier'),
              attributes: ['id','acceptedByRestaurantAt'],
              include: [
                {
                  model: App.getModel('Restaurant'),
                  attributes: [
                    'id','name','image','description','lat','lon', 
                    'cityId','zip','street','type',
                    'orderPrepTime', 'timezone',
                  ],
                  include: [{
                    model: App.getModel('City'),
                    attributes: ['id','name','stateId'],
                    // include: [{
                    //   model: App.getModel('State'),
                    //   attributes: ['id','name'],
                    // }]
                  }]
                },
                {
                  model: App.getModel('OrderSupplierItem'),
                  attributes: ['id','amount'],
                  include: [{
                    model: App.getModel('MenuItem'),
                    attributes: ['id','name','image']
                  }]
                },
              ]
            },
          ]
        }]
      });

      if( !App.isObject(mRequest) || !App.isPosNumber(mRequest.id) )
        return App.json( res, 404, App.t(['Request id not found'], req.lang) );

      if( mRequest.isAccepted )
        return App.json( res, 417, App.t(['Request has been already accepted'], req.lang) );

      if( mRequest.isRejected )
        return App.json( res, 417, App.t(['Request has been already rejected'], req.lang) );


      const mOrder = mRequest.Order;
      const mOrderDeliveryAddress = mOrder.OrderDeliveryAddress; // .DeliveryAddress
      const mOrderDeliveryTime = mOrder.OrderDeliveryTime; // .DeliveryAddress
      const mOrderDeliveryType = mOrder.OrderDeliveryType; // .type
      const mClient = mOrder.Client; // .User
      const mOrderSuppliers = mOrder.OrderSuppliers; // .id, .Restaurant, .OrderSupplierItems: [ MenuItems ]

      const data_t = {
        order: {
          id: mOrder.id,
          clientDescription: mOrder.clientDescription,
          status: mOrder.status,
          totalItems: mOrder.totalItems,
          totalRestaurants: mOrderSuppliers.length,
          // isRejectedByClient: mOrder.isRejectedByClient, 
          // rejectionReason: mOrder.rejectionReason, 
          // isCanceledByClient: mOrder.isCanceledByClient, 
          // cancellationReason: mOrder.cancellationReason, 
        },
        client: {
          id: mClient.id,
          firstName: mClient.User.firstName,
          lastName: mClient.User.lastName,
          image: mClient.User.image,
          phone: mClient.User.phone,
          distance: 0,
          units: '',
        },
        deliveryTime: {
          day: mOrderDeliveryTime.deliveryDay,
          hour: mOrderDeliveryTime.deliveryHour,
          value: mOrderDeliveryTime.deliveryTimeValue,
          type: mOrderDeliveryTime.deliveryTimeType,
        },
        deliveryType: {
          type: mOrderDeliveryType.type,
        },
        deliveryAddress: {
          ...( App.isObject(mOrderDeliveryAddress.DeliveryAddress) ? mOrderDeliveryAddress.DeliveryAddress.toJSON() : {}),
        },
        suppliers: [],
        income: {
          // '// NOTE': 'this will change: ...',
          amount: mOrder.deliveryPrice,
          code: 'USD',
          symbol: '$',
        },
      };

      let from = mCourier;

      for( const mOrderSupplier of mOrderSuppliers ){
        const mRestaurant = mOrderSupplier.Restaurant;

        if( !App.isObject(mRestaurant) || !App.isPosNumber(mRestaurant.id) )
          continue;

        const menuItems = ( App.isArray(mOrderSupplier.OrderSupplierItems) ? mOrderSupplier.OrderSupplierItems :[] )
          .map((mOrderSupplierItem)=>{
            return {
              id: mOrderSupplierItem.MenuItem.id,
              name: mOrderSupplierItem.MenuItem.name,
              image: mOrderSupplierItem.MenuItem.image,
              amount: mOrderSupplierItem.amount,
            }
          });

        const { distance, units } = App.geo.lib.getDistance( from, mRestaurant, 'miles' ).data;

        const pickUpDateTime = App.getModel('Restaurant')
          .calcOrderPickUpTime({
            fromDate: (mOrder.paidAt || mOrderSupplier.acceptedByRestaurantAt), 
            add: mRestaurant.orderPrepTime, 
            timezone: mRestaurant.timezone, 
            // format: moment.humanDatetimeFormat, // <<= default | 'ha z' | moment.humanTimeFormat | false
          });

        data_t.suppliers.push({
          id: mRestaurant.id,
          name: mRestaurant.name,
          type: mRestaurant.type,
          image: mRestaurant.image,
          description: mRestaurant.description,
          city: mRestaurant.City.name,
          street: mRestaurant.street,
          zip: mRestaurant.zip,
          lat: mRestaurant.lat,
          lon: mRestaurant.lon,
          distance, 
          units,
          menuItems,
          pickUpDateTime, // pickUpTime{..} => pickUpDateTime => <string> datetime
        });

        from = mRestaurant;

      }

      if( App.isObject(mOrderDeliveryAddress) && App.isObject(mOrderDeliveryAddress.DeliveryAddress) ){
        // distance from last Restaurant to Client || DeliveryAddress
        // const { distance, units } = App.geo.lib.getDistance( from, mClient, 'miles' ).data;
        const { distance, units } = App.geo.lib.getDistance( from, mOrderDeliveryAddress.DeliveryAddress, 'miles' ).data;
        data_t.client.distance = distance;
        data_t.client.units = units;
      }

      // console.json({data_t});
      await App.json( res, true, App.t(['success'], res.lang), data_t );

    }catch(e){
      console.log(e);
      App.onRouteError( req, res, e );
      // App.json( res, false, App.t('request-could-not-be-processed', req.lang) );
    }

  });

  return { router, method: '', autoDoc:{} };

};


