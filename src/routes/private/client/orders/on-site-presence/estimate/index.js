const express = require('express');
const router = express.Router();

// {
//   "restaurantId": "required: <number>: Ref. Restaurant.id",
//   "eventDate": "required: <string>: YYYY-MM-DD format",
//   "numberOfPeople": "required: <number>: Number of people attending",
//   "numberOfHours": "required: <number>: Hours of service required"
// }

// Example:
// {
//   "restaurantId": 57,
//   "eventDate": "2025-11-20",
//   "numberOfPeople": 50,
//   "numberOfHours": 4
// }

// /private/client/orders/on-site-presence/estimate

module.exports = function(App, RPath){

  router.use('', async(req, res)=>{

    try{

      const data = req.getPost();
      const mUser = await req.user;
      const mClient = await req.client;

      // Validate required fields
      const restaurantId = req.getCommonDataInt('restaurantId', null);
      const eventDate = req.getCommonDataString('eventDate', null);
      const numberOfPeople = req.getCommonDataInt('numberOfPeople', null);
      const numberOfHours = req.getCommonDataInt('numberOfHours', null);

      if(App.isNull(restaurantId))
        return App.json(res, 417, App.t(['Restaurant ID is required'], req.lang));

      if(App.isNull(eventDate))
        return App.json(res, 417, App.t(['Event date is required'], req.lang));

      if(App.isNull(numberOfPeople) || numberOfPeople <= 0)
        return App.json(res, 417, App.t(['Number of people is required and must be greater than 0'], req.lang));

      if(App.isNull(numberOfHours) || numberOfHours <= 0)
        return App.json(res, 417, App.t(['Number of hours is required and must be greater than 0'], req.lang));

      // Validate date format (YYYY-MM-DD)
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if(!dateRegex.test(eventDate))
        return App.json(res, 417, App.t(['Invalid date format. Use YYYY-MM-DD'], req.lang));

      // Check if date is in the future
      const eventDateTime = new Date(eventDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if(eventDateTime < today)
        return App.json(res, 417, App.t(['Event date must be in the future'], req.lang));

      // Check if restaurant exists
      const mRestaurant = await App.getModel('Restaurant').findByPk(restaurantId);
      if(!App.isObject(mRestaurant) || !App.isPosNumber(mRestaurant.id))
        return App.json(res, 404, App.t(['Restaurant not found'], req.lang));

      // Check if restaurant supports on-site presence
      const isSupported = await App.getModel('RestaurantOrderTypeSettings').isOrderTypeEnabled(
        restaurantId,
        'on-site-presence'
      );

      if(!isSupported)
        return App.json(res, 417, App.t(['Restaurant does not support on-site presence orders'], req.lang));

      // Check if date is available
      const isDateAvailable = await App.getModel('RestaurantUnavailableDates').isDateAvailable(
        restaurantId,
        eventDate
      );

      if(!isDateAvailable)
        return App.json(res, 417, App.t(['Selected date is not available for this restaurant'], req.lang));

      // Calculate price estimate
      const priceResult = await App.getModel('RestaurantOrderTypeSettings').calculateOnSitePresencePrice(
        restaurantId,
        {
          numberOfPeople,
          numberOfHours,
        }
      );

      if(!priceResult.success)
        return App.json(res, 417, App.t([priceResult.message], req.lang));

      // Return estimate
      await App.json(res, true, App.t(['Price calculated successfully'], req.lang), {
        restaurantId,
        restaurantName: mRestaurant.name,
        eventDate,
        numberOfPeople,
        numberOfHours,
        estimate: {
          basePrice: priceResult.data.basePrice,
          serviceFee: priceResult.data.serviceFee,
          serviceFeePercentage: priceResult.data.serviceFeePercentage,
          totalPrice: priceResult.data.totalPrice,
          pricingModel: priceResult.data.pricingModel,
          breakdown: priceResult.data.breakdown,
        }
      });

    }catch(e){
      console.log(e);
      App.onRouteError(req, res, e);
    }

  });

  return { router, method: '', autoDoc:{} };

};
