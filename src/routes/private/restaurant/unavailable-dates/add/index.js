const express = require('express');
const router = express.Router();

// {
//   "unavailableDate": "required: <string>: YYYY-MM-DD format",
//   "reason": "optional: <string>: Reason for blocking the date"
// }

// /private/restaurant/unavailable-dates/add

module.exports = function(App, RPath){

  router.use('', async(req, res)=>{

    try{

      const data = req.getPost();
      const mUser = await req.user;
      const mRestaurant = await req.restaurant;

      const unavailableDate = req.getCommonDataString('unavailableDate', null);
      const reason = req.getCommonDataString('reason', '').substr(0, 500);

      if(App.isNull(unavailableDate))
        return App.json(res, 417, App.t(['Date is required'], req.lang));

      // Validate date format
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if(!dateRegex.test(unavailableDate))
        return App.json(res, 417, App.t(['Invalid date format. Use YYYY-MM-DD'], req.lang));

      // Check if date is in the future or today
      const dateToBlock = new Date(unavailableDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if(dateToBlock < today)
        return App.json(res, 417, App.t(['Cannot block past dates'], req.lang));

      // Add unavailable date
      const result = await App.getModel('RestaurantUnavailableDates').addUnavailableDate(
        mRestaurant.id,
        unavailableDate,
        reason
      );

      if(!result.success)
        return App.json(res, 417, App.t([result.message], req.lang));

      await App.json(res, true, App.t(['Date marked as unavailable successfully'], req.lang), {
        unavailableDate: {
          id: result.data.id,
          date: result.data.unavailableDate,
          reason: result.data.reason || null,
          isFullDayBlocked: result.data.isFullDayBlocked,
        }
      });

    }catch(e){
      console.log(e);
      App.onRouteError(req, res, e);
    }

  });

  return { router, method: '', autoDoc:{} };

};
