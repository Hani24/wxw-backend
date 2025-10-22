const express = require('express');
const router = express.Router();

// Optional query params:
// ?startDate=YYYY-MM-DD
// ?endDate=YYYY-MM-DD

// /private/restaurant/unavailable-dates/get

module.exports = function(App, RPath){

  router.use('', async(req, res)=>{

    try{

      const data = req.getPost();
      const mUser = await req.user;
      const mRestaurant = await req.restaurant;

      const startDate = req.getCommonDataString('startDate', null);
      const endDate = req.getCommonDataString('endDate', null);

      // Get unavailable dates
      const dates = await App.getModel('RestaurantUnavailableDates').getByRestaurantId(
        mRestaurant.id,
        startDate,
        endDate
      );

      // Format response
      const formattedDates = dates.map(d => ({
        id: d.id,
        date: d.unavailableDate,
        reason: d.reason || null,
        isFullDayBlocked: d.isFullDayBlocked,
        blockedFromTime: d.blockedFromTime,
        blockedToTime: d.blockedToTime,
        createdAt: d.createdAt,
      }));

      await App.json(res, true, App.t(['success'], req.lang), {
        unavailableDates: formattedDates,
        count: formattedDates.length,
      });

    }catch(e){
      console.log(e);
      App.onRouteError(req, res, e);
    }

  });

  return { router, method: '', autoDoc:{} };

};
