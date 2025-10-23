const express = require('express');
const router = express.Router();

// /private/restaurant/order-type-settings/get

module.exports = function(App, RPath){

  router.use('', async(req, res)=>{

    try{

      const mUser = await req.user;
      const mRestaurant = await req.restaurant;

      // Get all order type settings for this restaurant
      const settings = await App.getModel('RestaurantOrderTypeSettings').findAll({
        where: {
          restaurantId: mRestaurant.id,
        },
        order: [['orderType', 'ASC']],
      });

      // Format response
      const formattedSettings = settings.map(s => ({
        id: s.id,
        orderType: s.orderType,
        isEnabled: s.isEnabled,
        pricingModel: s.pricingModel,
        basePrice: s.basePrice ? parseFloat(s.basePrice) : null,
        pricePerPerson: s.pricePerPerson ? parseFloat(s.pricePerPerson) : null,
        pricePerHour: s.pricePerHour ? parseFloat(s.pricePerHour) : null,
        minPeople: s.minPeople,
        maxPeople: s.maxPeople,
        minHours: s.minHours,
        maxHours: s.maxHours,
        serviceFeePercentage: s.serviceFeePercentage ? parseFloat(s.serviceFeePercentage) : 15.00,
      }));

      await App.json(res, true, App.t(['success'], req.lang), {
        settings: formattedSettings
      });

    }catch(e){
      console.log(e);
      App.onRouteError(req, res, e);
    }

  });

  return { router, method: '', autoDoc:{} };

};
