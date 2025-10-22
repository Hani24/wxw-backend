const express = require('express');
const router = express.Router();

// {
//   "id": "required: <number>: Ref. RestaurantUnavailableDates.id"
// }

// /private/restaurant/unavailable-dates/delete/by/id

module.exports = function(App, RPath){

  router.use('', async(req, res)=>{

    try{

      const data = req.getPost();
      const mUser = await req.user;
      const mRestaurant = await req.restaurant;

      const id = req.getCommonDataInt('id', null);

      if(App.isNull(id))
        return App.json(res, 417, App.t(['ID is required'], req.lang));

      // Check if record exists and belongs to this restaurant
      const record = await App.getModel('RestaurantUnavailableDates').findOne({
        where: {
          id: id,
          restaurantId: mRestaurant.id,
        }
      });

      if(!App.isObject(record) || !App.isPosNumber(record.id))
        return App.json(res, 404, App.t(['Record not found'], req.lang));

      // Delete the record
      const result = await App.getModel('RestaurantUnavailableDates').removeUnavailableDate(id);

      if(!result.success)
        return App.json(res, 417, App.t([result.message], req.lang));

      await App.json(res, true, App.t(['Date unblocked successfully'], req.lang));

    }catch(e){
      console.log(e);
      App.onRouteError(req, res, e);
    }

  });

  return { router, method: '', autoDoc:{} };

};
