const express = require('express');
const router = express.Router();

// {
//   "dateFrom": "optional: <string:date>: iso-8601: e.g. 2022-04-01",
//   "dateUpto": "optional: <string:date>: iso-8601: e.g. 2022-04-16"
// }

// /private/restaurant/statistics/get/all/by/date/range/

module.exports = function(App, RPath){

  router.use('', async(req, res)=>{

    try{

      const data = req.getPost();
      // const mUser = await req.user; // restaurant-owner
      const mRestaurant = await req.restaurant;

      const chart = await App.getModel('RestaurantStatistic')
        .getChartByIdAndDateRange( mRestaurant.id, data.dateFrom, data.dateUpto );

      const isDefaultDate = !( !! App.DT.isValidDate( data.dateFrom ) );

      const mainState = isDefaultDate
        ? await App.getModel('RestaurantStatistic').getStateFromGlobalData( mRestaurant )
        : await App.getModel('RestaurantStatistic').getStateFromChartData( chart )

      const data_t = {
        chart,
        mainState, 
        isDefaultDate,
      };

      // console.json({data_t});

      App.json( res, true, App.t(['success'], res.lang), data_t);

    }catch(e){
      console.log(e);
      App.onRouteError( req, res, e );
      // App.json( res, false, App.t('request-could-not-be-processed', req.lang) );
    }

  });

  return { router, method: '', autoDoc:{} };

};


