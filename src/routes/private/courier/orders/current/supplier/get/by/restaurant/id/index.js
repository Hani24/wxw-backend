const express = require('express');
const router = express.Router();

// {
//   "id": "required: <number> Ref. Restaurant.id"
// }

// {
//   "supplierId": 2
// }

// /private/courier/orders/current/supplier/get/by/restaurant/id/:id

module.exports = function(App, RPath){

  router.use('', async(req, res)=>{

    try{

      const data = req.getPost();
      const mUser = await req.user;
      const mCourier = await req.courier;

      if( !mCourier.hasActiveOrder || !App.isPosNumber(mCourier.activeOrderId) )
        return App.json( res, 404, App.t(['you','do-not','have','active','order'], req.lang) );

      const statuses = App.getModel('Order').getStatuses();

      const restaurantId = req.getCommonDataInt('id', null);
      if( !App.isPosNumber(restaurantId) )
        return App.json( res, 417, App.t(['restaurant','id','is-required'], req.lang) );

      if( !(await App.getModel('Restaurant').isset({ id: restaurantId })) )
        return App.json( res, 417, App.t(['restaurant','not-found','or/and','do','not','belong','to','your','current','order'], req.lang));

      const mOrder = await App.getModel('Order').findOne({
        model: App.getModel('Order'),
        where: {
          status: statuses.processing, 
          id: mCourier.activeOrderId, // 10000000001
          courierId: mCourier.id,
        },
        attributes: [
          'id','status','clientDescription','totalItems', 
          'deliveryPrice', 'deliveryPriceUnitPrice','deliveryPriceUnitType',
          'allSuppliersHaveConfirmedAt',
          'expectedDeliveryTime',
          'isPaid', 'paidAt',
        ],
        include: [
          {
            model: App.getModel('OrderDeliveryAddress'),
            required: true,
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
          // {
          //   model: App.getModel('OrderDeliveryTime'),
          //   required: true,
          //   attributes: [
          //     'id','deliveryDay','deliveryHour','deliveryTimeValue','deliveryTimeType'
          //   ],
          // },
          // {
          //   required: true,
          //   model: App.getModel('OrderDeliveryType'),
          //   attributes: [ 'id','type' ],
          // },
          {
            required: true,
            model: App.getModel('Client'),
            attributes: ['id','lat','lon'],
            include: [{
              model: App.getModel('User'),
              attributes: ['id','firstName','lastName','image','phone'],
            }]
          },
          {
            required: true,
            model: App.getModel('OrderSupplier'),
            where: {
              restaurantId,
            },
            attributes: [
              'id','restaurantId',
              'isTakenByCourier','takenByCourierAt',
              'isCanceledByRestaurant','cancellationReason',
              'isOrderReady','orderReadyAt',
              'isOrderDelayed','orderDelayedFor', // 'orderDelayedAt'
              'acceptedByRestaurantAt',
            ],
            include: [
              {
                model: App.getModel('OrderSupplierItem'),
                attributes: ['id','amount','totalPrice'],
                include: [{
                  model: App.getModel('MenuItem'),
                  attributes: ['id','name','image','price']
                }]
              },
              {
                model: App.getModel('Restaurant'),
                attributes: [
                  'id','name','image','description',
                  'cityId','zip','street','type',
                  'lat','lon', 'orderPrepTime',
                  'timezone',
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
            ]
          },
        ]
      });

      if( !App.isObject(mOrder) || !App.isPosNumber(mOrder.id) )
        return App.json( res, 404, App.t(['order','not-found'], req.lang));

      if( !App.isArray(mOrder.OrderSuppliers) || !mOrder.OrderSuppliers.length )
        return App.json( res, 404, App.t(['order-supplier','not-found'], req.lang));

      const mOrderDeliveryAddress = mOrder.OrderDeliveryAddress; // .DeliveryAddress
      // const mOrderDeliveryTime = mOrder.OrderDeliveryTime; // .DeliveryAddress
      // const mOrderDeliveryType = mOrder.OrderDeliveryType; // .type
      const mClient = mOrder.Client; // .User
      const mOrderSupplier = mOrder.OrderSuppliers[0];
      const mRestaurant = mOrderSupplier.Restaurant;

      const data_t = {
        order: {
          id: mOrder.id,
          clientDescription: mOrder.clientDescription,
          isPaid: mOrder.isPaid,
          status: mOrder.status,
          totalItems: mOrder.totalItems,
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
        // deliveryTime: {
        //   day: mOrderDeliveryTime.deliveryDay,
        //   hour: mOrderDeliveryTime.deliveryHour,
        //   value: mOrderDeliveryTime.deliveryTimeValue,
        //   type: mOrderDeliveryTime.deliveryTimeType,
        // },
        // deliveryType: {
        //   type: mOrderDeliveryType.type,
        // },
        deliveryAddress: {
          ...mOrderDeliveryAddress.DeliveryAddress.toJSON(),
        },
        supplier: {
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
          states: {
            isTakenByCourier: mOrderSupplier.isTakenByCourier,
            takenByCourierAt: mOrderSupplier.takenByCourierAt,
            isCanceledByRestaurant: mOrderSupplier.isCanceledByRestaurant,
            cancellationReason: mOrderSupplier.cancellationReason,
            isOrderReady: mOrderSupplier.isOrderReady,
            orderReadyAt: mOrderSupplier.orderReadyAt,
            isOrderDelayed: mOrderSupplier.isOrderDelayed,
            orderDelayedFor: mOrderSupplier.orderDelayedFor,
            orderDelayedAt: mOrderSupplier.orderDelayedAt,
          },
          menuItems: ( App.isArray(mOrderSupplier.OrderSupplierItems) ? mOrderSupplier.OrderSupplierItems :[] )
          .map((mOrderSupplierItem)=>{
            return {
              id: mOrderSupplierItem.MenuItem.id,
              name: mOrderSupplierItem.MenuItem.name,
              image: mOrderSupplierItem.MenuItem.image,
              price: mOrderSupplierItem.MenuItem.price,
              amount: mOrderSupplierItem.amount,
              totalPrice: mOrderSupplierItem.totalPrice,
            }
          }),
          // distance, 
          // units,
          // pickUpDateTime, // pickUpTime{..} => pickUpDateTime => <string> datetime
        },
        // income: {
        //   // '// NOTE': 'this will change: ...',
        //   amount: mOrder.deliveryPrice,
        //   code: 'USD',
        //   symbol: '$',
        // },
      };

      await App.json( res, true, App.t(['success'], res.lang), data_t );

    }catch(e){
      console.log(e);
      App.onRouteError( req, res, e );
      // App.json( res, false, App.t('request-could-not-be-processed', req.lang) );
    }

  });

  return { router, method: '', autoDoc:{} };

};


