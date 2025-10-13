const express = require('express');
const router = express.Router();

// /private/courier/orders/current/get

module.exports = function(App, RPath){

  router.use('', async(req, res)=>{

    try{

      const data = req.getPost();
      const mUser = await req.user;
      const mCourier = await req.courier;

      // console.json({mCourier});

      if( !mCourier.hasActiveOrder || !mCourier.activeOrderId )
        return App.json( res, 417, App.t(['You do not have any active order'], req.lang) );

      const statuses = App.getModel('Order').getStatuses();

      const mDeliveryPriceSettings = await App.getModel('DeliveryPriceSettings').getSettings();
      if( !App.isObject(mDeliveryPriceSettings) || !App.isPosNumber(mDeliveryPriceSettings.id) )
        return App.json( res, 417, App.t(['Unable to find delivery price settings'], req.lang) );

      const mOrder = await App.getModel('Order').findOne({
        model: App.getModel('Order'),
        where: {
          status: statuses.processing,
          id: mCourier.activeOrderId,
          courierId: mCourier.id,
          // isPaid: true,
        },
        attributes: [
          'id','status','clientDescription','totalItems', 
          'deliveryPrice', 'deliveryPriceUnitPrice','deliveryPriceUnitType',
          'allSuppliersHaveConfirmedAt',
          'expectedDeliveryTime',
          'isPaid', 'paidAt',
        ],
        distinct: true,
        include: [
          {
            model: App.getModel('OrderDeliveryAddress'),
            // required: true,
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
            attributes: [
              'id',
              'isTakenByCourier','takenByCourierAt',
              'isCanceledByRestaurant','cancellationReason',
              'isOrderReady','orderReadyAt',
              'isOrderDelayed','orderDelayedFor', // 'orderDelayedAt'
              'acceptedByRestaurantAt',
            ],
            // order: [['id','desc']],
            include: [
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
              {
                model: App.getModel('OrderSupplierItem'),
                attributes: ['id','amount','totalPrice'],
                include: [{
                  model: App.getModel('MenuItem'),
                  attributes: ['id','name','image','price']
                }]
              },
            ]
          },
        ]
      });

      if( !App.isObject(mOrder) || !App.isPosNumber(mOrder.id) )
        return App.json( res, 404, App.t(['Active order not found'], req.lang) );

      const mOrderDeliveryAddress = mOrder.OrderDeliveryAddress; // .DeliveryAddress
      const mOrderDeliveryTime = mOrder.OrderDeliveryTime; // .DeliveryAddress
      const mOrderDeliveryType = mOrder.OrderDeliveryType; // .type
      const mClient = mOrder.Client; // .User
      const mOrderSuppliers = mOrder.OrderSuppliers; // .id, .Restaurant, .OrderSupplierItems: [ MenuItems ]

      // expectedDeliveryTime: already includes all [order-delays]
      const expectedDeliveryTime = App.DT.moment(mOrder.expectedDeliveryTime || App.getISODate())
        // .add( add, 'minutes' )
        .tz( mUser.timezone )
        .format( App.getDateFormat() );

      // base time when all restaurants have confirm [paid: in current inmplementation] order
      // so [paidAt] will be before [allSuppliersHaveConfirmedAt]
      const allSuppliersHaveConfirmedAt = App.DT.moment(mOrder.allSuppliersHaveConfirmedAt || App.getISODate())
        // .add( add, 'minutes' )
        .tz( mUser.timezone )
        .format( App.getDateFormat() );

      const data_t = {
        order: {
          id: mOrder.id,
          clientDescription: mOrder.clientDescription,
          isPaid: mOrder.isPaid,
          status: mOrder.status,
          totalItems: mOrder.totalItems,
          expectedDeliveryTime,
          allSuppliersHaveConfirmedAt,
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
          ...mOrderDeliveryAddress.DeliveryAddress.toJSON(),
        },
        suppliers: [],
        income: {
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
              price: mOrderSupplierItem.MenuItem.price,
              amount: mOrderSupplierItem.amount,
              totalPrice: mOrderSupplierItem.totalPrice,
            }
          });

        const { distance, units } = {
          ...(App.geo.lib.getDistance( from, mRestaurant, mDeliveryPriceSettings.unitType ).data || {distance: 0, units:''})
        };

        const pickUpDateTime = App.getModel('Restaurant')
          .calcOrderPickUpTime({
            fromDate: (mOrderSupplier.acceptedByRestaurantAt || mOrder.paidAt), 
            add: ((+mRestaurant.orderPrepTime) + ( (+mOrderSupplier.orderDelayedFor) || 0 )), 
            timezone: mUser.timezone || mRestaurant.timezone, 
            // format: moment.humanDatetimeFormat, // <<= 'ha z' | moment.humanTimeFormat | false
          });

        data_t.suppliers.push({
          // id: mOrderSupplier.id,
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
          pickUpDateTime, // pickUpTime{..} => pickUpDateTime => <string> datetime
        });

        from = mRestaurant;

      }

      data_t.suppliers = data_t.suppliers.sort((A,B)=>{
        return ((A.isTakenByCourier) && (!B.isTakenByCourier)) ? 1 : -1;
      });

      if( App.isObject(mOrderDeliveryAddress) && App.isObject(mOrderDeliveryAddress.DeliveryAddress) ){
        // distance from last Restaurant to Client || DeliveryAddress
        // const { distance, units } = App.geo.lib.getDistance( from, mClient, 'miles' ).data;
        const getDistanceRes = App.geo.lib.getDistance( from, mOrderDeliveryAddress.DeliveryAddress, mDeliveryPriceSettings.unitType );
        if( getDistanceRes.success ){
          const { distance, units } = getDistanceRes.data;
          data_t.client.distance = distance;
          data_t.client.units = units;
        }
      }

      // console.json({data_t});
      App.json( res, true, App.t(['success'], res.lang), data_t );

    }catch(e){
      console.log(e);
      App.onRouteError( req, res, e );
      // App.json( res, false, App.t('request-could-not-be-processed', req.lang) );
    }

  });

  return { router, method: '', autoDoc:{} };

};


