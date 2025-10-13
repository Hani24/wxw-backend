const express = require('express');
const router = express.Router();

// {
//   "dateFrom": "optional: <string:date>: iso-8601: e.g. 2022-04-01",
//   "dateUpto": "optional: <string:date>: iso-8601: e.g. 2022-04-16",
//   "restaurantId": "optional: <number> Ref. Restaurant.id"
// }

// {
//   "dateFrom": "2022-04-13",
//   "dateUpto": "2022-04-13",
//   "restaurantId": "optional: <number> Ref. Restaurant.id"
// }

// /private/admin/statistics/global/get/all/by/date/range/

module.exports = function(App, RPath){

  router.use('', async(req, res)=>{

    try{

      const data = req.getPost();
      // const mUser = await req.user; // admin
      // const mRestaurant = await req.restaurant; // => global resto admin panel (if selected)
      const isDefaultDate = !( !! App.DT.isValidDate( data.dateFrom ) );
      const restaurantId = req.getCommonDataInt('restaurantId', null);
      const isRestaurantData = App.isPosNumber(restaurantId);

      let chart = null;
      let mainState = null;

      if( isRestaurantData ){

        const mRestaurant = await App.getModel('Restaurant').getByFields({id: restaurantId});
        if( !App.isObject(mRestaurant) || !App.isPosNumber(mRestaurant.id) )
          return App.json( res, 404, App.t(['restaurant','not-found'], res.lang))

        chart = await App.getModel('RestaurantStatistic')
          .getChartByIdAndDateRange( mRestaurant.id, data.dateFrom, data.dateUpto );

        mainState = isDefaultDate
          ? await App.getModel('RestaurantStatistic').getStateFromGlobalData( mRestaurant )
          : await App.getModel('RestaurantStatistic').getStateFromChartData( chart )

      }else{
        chart = await App.getModel('DailySummaryStatistic')
          .getChartByDateRange( data.dateFrom, data.dateUpto );

        mainState = isDefaultDate
          ? await App.getModel('DailySummaryStatistic').getStateFromGlobalData()
          : await App.getModel('DailySummaryStatistic').getStateFromChartData( chart )

      }

      const data_t = {
        chart,
        mainState, 
        isDefaultDate,
        isRestaurantData,
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


