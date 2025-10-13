const express = require('express');
const router = express.Router();

// /private/restaurant/orders/history/get/all/

module.exports = function(App, RPath){

  router.use('', async(req, res)=>{

    try{

      const mUser = await req.user;
      const mRestaurant = await req.restaurant;

      const {offset, limit, order, by} = req.getPagination({});
      const orderBy = App.getModel('Order').getOrderBy(by);
      const statuses = App.getModel('Order').getStatuses();

      // console.json({mRestaurant});

      const statusAsOption = [
        statuses.processing,  // Now included - active/current orders
        statuses.refunded,
        statuses.delivered,
        statuses.discarded,
      ];

      if( req.getCommonDataString('showCanceled') ){
        statusAsOption.push(statuses.canceled);
     }

     const mRestaurantOrders = await App.getModel('Restaurant').getAllOrdersWhere(
        {
          // Order: { where: {...} }
          status: {
            [ App.DB.Op.or ]: statusAsOption
          }
        },
        {
          // OrderSupplier: { where: {...} }
          restaurantId: mRestaurant.id,
          // [ App.DB.Op.or ]: {
          //   isTakenByCourier: true,
          //   isCanceledByRestaurant: true,
          //   isAcceptedByRestaurant: true,
          //   isOrderReady: true,
          //   // isOrderDelayed: true,
          // }
        }, 
        { offset, limit, order:'desc', orderBy }
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

