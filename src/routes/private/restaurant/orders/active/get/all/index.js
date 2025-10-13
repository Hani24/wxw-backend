const express = require('express');
const router = express.Router();

// /private/restaurant/orders/active/get/all/

module.exports = function(App, RPath){

  router.use('', async(req, res)=>{

    try{

      const mUser = await req.user;
      const mRestaurant = await req.restaurant;

      const {offset, limit, order, by} = req.getPagination({});
      const orderBy = App.getModel('Order').getOrderBy(by);
      const statuses = App.getModel('Order').getStatuses();

      const mRestaurantOrders = await App.getModel('Restaurant').getAllOrdersWhere(
        {
          // Order: { where: {...} }
          isDeliveredByCourier: false,
          isCanceledByClient: false,
          allSuppliersHaveConfirmed: true,
          // isPaid: true,
          isRefunded: false,
          status: statuses.processing,
          // [ App.DB.Op.and ]: {
          //   status: {
          //     [ App.DB.Op.or ]: [
          //       statuses.processing,
          //       // statuses.refunded,
          //       // statuses.canceled,
          //       // statuses.delivered,
          //       // statuses.discarded,
          //     ]
          //   }
          // }
        },
        {
          // OrderSupplier: { where: {...} }
          restaurantId: mRestaurant.id,
          isTakenByCourier: false,
          isCanceledByRestaurant: false,
          isAcceptedByRestaurant: true,
          isOrderReady: false,
          // [ App.DB.Op.and ]: {
          //   [ App.DB.Op.or ]: {
          //     // isTakenByCourier: true,
          //     // isCanceledByRestaurant: true,
          //     isAcceptedByRestaurant: true,
          //     // isOrderReady: true,
          //     // isOrderDelayed: true,
          //   }
          // }
        }, 
        { offset, limit, order, orderBy }
      );

      App.json( res, true, App.t('success', res.lang), mRestaurantOrders);

    }catch(e){
      console.log(e);
      App.onRouteError( req, res, e );
      // App.json( res, false, App.t('request-could-not-be-processed', req.lang) );
    }

  });

  return { router, method: '', autoDoc:{} };

};


