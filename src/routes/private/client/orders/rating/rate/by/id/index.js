const express = require('express');
const router = express.Router();

// {
//   "id": "required: <number> Ref. Order.id",
//   "courierRating": "optional: <number>: range: ( 0-5 )",
//   "orderSupplierItemsRating": "optional: <array>: [ {objects} ]",
//   "example": [
//     { "id": "Ref. OrderSupplierItem.id", "rating": "<number>: range: ( 0-5 )" },
//     { "id": "Ref. OrderSupplierItem.id", "rating": "<number>: range: ( 0-5 )" },
//     { "id": "Ref. OrderSupplierItem.id", "rating": "<number>: range: ( 0-5 )" }
//   ]
// }

// {
//   "id": 10000000131,
//   "courierRating": 4,
//   "orderSupplierItemsRating": [
//     { "id": 253, "rating": 4 }
//   ]
// }

// /private/client/orders/rating/rate/by/id/:id

module.exports = function(App, RPath){

  router.use('', async(req, res)=>{

    try{

      const mUser = await req.user;
      const mClient = await req.client;
      const data = req.getPost();
      const id = req.getCommonDataInt('id',null);
      const statuses = App.getModel('Order').getStatuses();

      if( App.isNull(id) )
        return App.json( res, 417, App.t(['order','id','is-required'], req.lang) );

      const mOrder = await App.getModel('Order').findOne({
        where: {
          id, // 10000000004
          clientId: mClient.id, // 2
          // status: statuses.delivered,
          // isOrderRatedByClient: false,
          // isDeliveredByCourier: true,
        },
        attributes: [
          'id',
          'courierId',
          'clientId',
          'status',
          'isOrderRatedByClient',
          'lastCourierId',
          'isDeliveredByCourier',
          'isCourierRatedByClient', // 'courierRatedByClientAt',
          'courierRating',
        ],
        // include: [{
        //   required: true,
        //   model: App.getModel('OrderSupplier'),
        //   attributes: ['id','restaurantId'],
        // }]
      });

      if( !App.isObject(mOrder) || !App.isPosNumber(mOrder.id) )
        return App.json( res, 404, App.t(['order','not-found'], req.lang) );

      if( mOrder.status !== statuses.delivered || ( ! mOrder.isDeliveredByCourier) ){
        // return App.json( res, 417, App.t(['Order','is-not','delivered','yes'], req.lang) );
        return App.json( res, 417, App.t(['you','cannnot','rate','undelivered','order'], req.lang) );        
      }

      const parseIntParams = { floor:true, min:0, max:5, abs: true };
      const orderSupplierItemsRating = (App.isArray( data.orderSupplierItemsRating ) ? data.orderSupplierItemsRating : [])
        .filter((mItemRating)=>{
          return ( App.isObject(mItemRating) && App.isPosNumber(mItemRating.id) && App.isNumber(mItemRating.rating) );
        })

      let totalRatedSuppliers = 0;

      for( const mItemRating of orderSupplierItemsRating ){

        try{

          const mOrderSupplier = await App.getModel('OrderSupplier').findOne({
            where: {
              orderId: mOrder.id,
              isOrderReady: true,
            },
            attributes: [ 'id','restaurantId' ],
            distinct: true,
            include: [{
              required: true,
              model: App.getModel('OrderSupplierItem'),
              attributes: [
                'id','restaurantId','isRatedByClient','rating',
              ],
              where: {
                id: mItemRating.id,
              },
              include: [{
                // required: true,
                model: App.getModel('MenuItem'),
                attributes: ['id','rating','totalRatings'],
              }]
            }]
          });

          if( !App.isObject(mOrderSupplier) || !App.isPosNumber(mOrderSupplier.id) ){
            console.warn(` #rate: Order id: ${mOrder.id} => OrderSupplierItems id: ${mItemRating.id}: not found`);
            continue;
          }

          if( App.isArray(mOrderSupplier.OrderSupplierItems) && mOrderSupplier.OrderSupplierItems.length ){

            const mOrderSupplierItem = mOrderSupplier.OrderSupplierItems[0];
            const isAlreadyRatedByClient = mOrderSupplierItem.isRatedByClient;
            const prevOrderRating = (isAlreadyRatedByClient ? (+mOrderSupplierItem.rating || 0) : 0);

            const updateOrderSupplierItem = await mOrderSupplierItem.update({
              isRatedByClient: true,
              ratedAt: App.getISODate(),
              rating: App.getPosNumber(mItemRating.rating, parseIntParams),
            });

            if( !App.isObject(updateOrderSupplierItem) || !App.isPosNumber(updateOrderSupplierItem.id) ){
              console.warn(` #rate: Order id: ${mOrder.id} => OrderSupplierItems id: ${mItemRating.id}: failed to update`);
              continue;
            }

            totalRatedSuppliers++;

            if( App.isObject(updateOrderSupplierItem.MenuItem) && App.isPosNumber(updateOrderSupplierItem.MenuItem.id) ){
              const rating = (updateOrderSupplierItem.MenuItem.rating -prevOrderRating)+( (+updateOrderSupplierItem.rating) );
              const totalRatings = (updateOrderSupplierItem.MenuItem.totalRatings + (isAlreadyRatedByClient?0:1));
              const updateMenuItem = await updateOrderSupplierItem.MenuItem.update({
                rating,
                totalRatings,
              });
            }

            const ratingState = await App.getModel('OrderSupplierItem').findOne({
              where: {
                restaurantId: mOrderSupplier.restaurantId,
                isRatedByClient: 1,
              },
              attributes: [
                // [ App.DB.fn('sum', App.DB.col('rating')), 'totalRating' ],
                // [ App.DB.fn('count', App.DB.col('id')), 'totalRates' ],
                [ App.DB.literal('sum(rating) / count(id)'), 'avgRating' ],
              ],
            });

            if( !App.isObject(ratingState) || App.isNull(ratingState.avgRating) ){
              console.warn(` failed to get restaurant rating: ${mOrderSupplier.restaurantId}, supplier: ${mOrderSupplier.id}`);
              continue;
            }

            const mRating = ratingState.toJSON();

            const updateRestaurantRating = await App.getModel('Restaurant').update(
              { rating: mRating.avgRating }, 
              { where: { id: mOrderSupplier.restaurantId } }
            );
            if( !App.isArray(updateRestaurantRating) || !updateRestaurantRating.length ){
              console.warn(` failed to update restaurant rating: ${mOrderSupplier.restaurantId}, supplier: ${mOrderSupplier.id}`);
              continue;
            }
            console.ok(` restaurant rating updated: ${mOrderSupplier.restaurantId}, supplier: ${mOrderSupplier.id}: [rating: ${mRating.avgRating}]`);

            const notifyData = {
              event: App.getModel('RestaurantNotification').getEvents()['orderRated'],
              type: App.getModel('RestaurantNotification').getTypes()['orderRated'],
              ack: false,
              data: {
                orderSupplierId: mOrderSupplier.id,
                orderId: mOrder.id,
                rating: mRating.avgRating,
              }, 
            };

            App.getModel('RestaurantNotification').notifyById( mOrderSupplier.restaurantId, notifyData, (5 *1000) )
              .then( async( notifyRes )=>{
                if( notifyRes.success ){}
                console.log(` #order: ${mOrder.id}, supplier: ${mOrderSupplier.id}: notify: [event:${notifyData.event}] => ${notifyRes.message}`);
              });

          }

        }catch(e){
          console.error(` #mItemRating: ${e.message}`);
          console.json({mItemRating});
        }

      }

      const order_t = {};
      const prevCourierRating = (mOrder.isCourierRatedByClient ? mOrder.courierRating : 0);

      if( totalRatedSuppliers > 0 ){ // allow partial menu-items/suppliers to be rated/unrated
        order_t.isOrderRatedByClient = true;
        order_t.orderRatedByClientAt = App.getISODate();
      }

      const courierRating = req.getCommonDataInt('courierRating',null);
      if( App.isNumber(courierRating) && App.isPosNumber(mOrder.lastCourierId) ){

        order_t.courierRating = App.getPosNumber(courierRating, parseIntParams);
        order_t.isCourierRatedByClient = true;
        order_t.courierRatedByClientAt = App.getISODate();

        const mCourier = await App.getModel('Courier').findOne({
          where: {
            // isDeleted: false,
            isRestricted: false,
            id: mOrder.lastCourierId
          },
          attributes: ['id','totalRating'],
        });

        if( App.isObject(mCourier) && App.isPosNumber(mCourier.id) ){
          const updateCourier = await mCourier.update({
            totalRating: Math.floor((mCourier.totalRating + order_t.courierRating) -prevCourierRating),
          });
        }

      }

      const orderUpdateRes = await mOrder.update( order_t );
      if( !App.isObject(orderUpdateRes) || !App.isPosNumber(orderUpdateRes.id) )
        return App.json( res, false, App.t(['failed-to','rate','the','order'], res.lang) );

      await App.json( res, true, App.t(['order','has-been','rated'], res.lang) );

    }catch(e){
      console.log(e);
      App.onRouteError( req, res, e );
      // App.json( res, false, App.t('request-could-not-be-processed', req.lang) );
    }

  });

  return { router, method: '', autoDoc:{} };

};


