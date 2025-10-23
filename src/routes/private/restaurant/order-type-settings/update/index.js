const express = require('express');
const router = express.Router();

// {
//   "orderType": "required: <string>: 'order-now' or 'on-site-presence'",
//   "isEnabled": "required: <boolean>",
//   "pricingModel": "optional: <string>: 'per-person', 'per-hour', or 'per-event'",
//   "basePrice": "optional: <number>",
//   "pricePerPerson": "optional: <number>",
//   "pricePerHour": "optional: <number>",
//   "minPeople": "optional: <number>",
//   "maxPeople": "optional: <number>",
//   "minHours": "optional: <number>",
//   "maxHours": "optional: <number>",
//   "serviceFeePercentage": "optional: <number>: defaults to 15.00"
// }

// /private/restaurant/order-type-settings/update

module.exports = function(App, RPath){

  router.use('', async(req, res)=>{

    try{

      const data = req.getPost();
      const mUser = await req.user;
      const mRestaurant = await req.restaurant;

      // Validate required fields
      const orderType = req.getCommonDataString('orderType', null);
      const isEnabled = App.getBoolFromValue(data.isEnabled);

      if(App.isNull(orderType))
        return App.json(res, 417, App.t(['Order type is required'], req.lang));

      // Validate order type
      const validOrderTypes = App.getModel('Order').getOrderTypes({asArray: true});
      if(!validOrderTypes.includes(orderType))
        return App.json(res, 417, App.t(['Invalid order type'], req.lang));

      // Find or create setting
      let setting = await App.getModel('RestaurantOrderTypeSettings').findOne({
        where: {
          restaurantId: mRestaurant.id,
          orderType: orderType,
        }
      });

      const updateData = {
        isEnabled: isEnabled,
      };

      // If it's on-site-presence and being enabled, validate required fields
      if(orderType === 'on-site-presence' && isEnabled) {

        const pricingModel = req.getCommonDataString('pricingModel', null);

        if(App.isNull(pricingModel))
          return App.json(res, 417, App.t(['Pricing model is required for on-site presence'], req.lang));

        const validPricingModels = App.getModel('RestaurantOrderTypeSettings').getPricingModels();
        if(!Object.values(validPricingModels).includes(pricingModel))
          return App.json(res, 417, App.t(['Invalid pricing model'], req.lang));

        updateData.pricingModel = pricingModel;

        // Validate pricing based on model
        switch(pricingModel) {
          case 'per-person': {
            const pricePerPerson = req.getCommonDataFloat('pricePerPerson', null);
            if(App.isNull(pricePerPerson) || pricePerPerson <= 0)
              return App.json(res, 417, App.t(['Price per person is required and must be greater than 0'], req.lang));
            updateData.pricePerPerson = pricePerPerson;
            updateData.pricePerHour = null;
            break;
          }
          case 'per-hour': {
            const pricePerHour = req.getCommonDataFloat('pricePerHour', null);
            if(App.isNull(pricePerHour) || pricePerHour <= 0)
              return App.json(res, 417, App.t(['Price per hour is required and must be greater than 0'], req.lang));
            updateData.pricePerHour = pricePerHour;
            updateData.pricePerPerson = null;
            break;
          }
          case 'per-event': {
            const basePrice = req.getCommonDataFloat('basePrice', null);
            if(App.isNull(basePrice) || basePrice <= 0)
              return App.json(res, 417, App.t(['Base price is required and must be greater than 0'], req.lang));
            updateData.basePrice = basePrice;
            updateData.pricePerPerson = null;
            updateData.pricePerHour = null;
            break;
          }
        }

        // Optional base price (for per-person and per-hour)
        if(pricingModel !== 'per-event') {
          const basePrice = req.getCommonDataFloat('basePrice', 0);
          updateData.basePrice = basePrice >= 0 ? basePrice : 0;
        }

        // Optional limits
        const minPeople = req.getCommonDataInt('minPeople', null);
        const maxPeople = req.getCommonDataInt('maxPeople', null);
        const minHours = req.getCommonDataInt('minHours', null);
        const maxHours = req.getCommonDataInt('maxHours', null);

        if(!App.isNull(minPeople) && minPeople > 0) updateData.minPeople = minPeople;
        if(!App.isNull(maxPeople) && maxPeople > 0) updateData.maxPeople = maxPeople;
        if(!App.isNull(minHours) && minHours > 0) updateData.minHours = minHours;
        if(!App.isNull(maxHours) && maxHours > 0) updateData.maxHours = maxHours;

        // Validate min/max
        if(updateData.minPeople && updateData.maxPeople && updateData.minPeople > updateData.maxPeople)
          return App.json(res, 417, App.t(['Minimum people cannot be greater than maximum people'], req.lang));

        if(updateData.minHours && updateData.maxHours && updateData.minHours > updateData.maxHours)
          return App.json(res, 417, App.t(['Minimum hours cannot be greater than maximum hours'], req.lang));

        // Optional service fee percentage
        const serviceFeePercentage = req.getCommonDataFloat('serviceFeePercentage', 15.00);
        if(serviceFeePercentage >= 0 && serviceFeePercentage <= 100) {
          updateData.serviceFeePercentage = serviceFeePercentage;
        }
      }

      // Create or update setting
      if(setting) {
        await setting.update(updateData);
      } else {
        setting = await App.getModel('RestaurantOrderTypeSettings').create({
          restaurantId: mRestaurant.id,
          orderType: orderType,
          ...updateData,
        });
      }

      // Return updated setting
      await App.json(res, true, App.t(['Order type settings updated successfully'], req.lang), {
        setting: {
          id: setting.id,
          orderType: setting.orderType,
          isEnabled: setting.isEnabled,
          pricingModel: setting.pricingModel,
          basePrice: setting.basePrice ? parseFloat(setting.basePrice) : null,
          pricePerPerson: setting.pricePerPerson ? parseFloat(setting.pricePerPerson) : null,
          pricePerHour: setting.pricePerHour ? parseFloat(setting.pricePerHour) : null,
          minPeople: setting.minPeople,
          maxPeople: setting.maxPeople,
          minHours: setting.minHours,
          maxHours: setting.maxHours,
          serviceFeePercentage: setting.serviceFeePercentage ? parseFloat(setting.serviceFeePercentage) : 15.00,
        }
      });

    }catch(e){
      console.log(e);
      App.onRouteError(req, res, e);
    }

  });

  return { router, method: '', autoDoc:{} };

};
