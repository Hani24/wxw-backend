const express = require('express');
const router = express.Router();

/*
Update catering menu item details
{
  "cateringMenuItemId": "required: <number>",
  "feedsPeople": "optional: <number>",
  "minimumQuantity": "optional: <number>",
  "leadTimeDays": "optional: <number>",
  "cateringPrice": "optional: <float>",
  "isAvailableForCatering": "optional: <boolean>"
}
*/

// POST /private/restaurant/catering-menu-items/update

module.exports = function(App, RPath){

  router.use('', async(req, res)=>{

    try{

      const mUser = await req.user;
      const mRestaurant = await req.restaurant;
      const data = req.getPost();

      const cateringMenuItemId = req.getCommonDataInt('cateringMenuItemId', null);
      if(!App.isPosNumber(cateringMenuItemId)){
        return App.json(res, 417, App.t(['field','[cateringMenuItemId]','is-required'], req.lang));
      }

      const CateringMenuItem = App.getModel('CateringMenuItem');
      const MenuItem = App.getModel('MenuItem');

      // Get catering menu item
      const cateringMenuItem = await CateringMenuItem.findOne({
        where: {
          id: cateringMenuItemId,
          isDeleted: false
        },
        include: [{
          model: MenuItem,
          as: 'MenuItem',
          where: {
            restaurantId: mRestaurant.id,
            isDeleted: false
          },
          required: true
        }]
      });

      if(!cateringMenuItem){
        return App.json(res, 404, App.t(['Catering-Menu-Item','not','found'], req.lang));
      }

      // Build update data
      const updateData = {};

      if(data.feedsPeople !== undefined){
        const feedsPeople = req.getCommonDataInt('feedsPeople', null);
        if(!App.isPosNumber(feedsPeople) || feedsPeople < 1){
          return App.json(res, 417, App.t(['field','[feedsPeople]','must-be','greater-than','0'], req.lang));
        }
        updateData.feedsPeople = feedsPeople;
      }

      if(data.minimumQuantity !== undefined){
        updateData.minimumQuantity = Math.max(1, req.getCommonDataInt('minimumQuantity', 1));
      }

      if(data.leadTimeDays !== undefined){
        updateData.leadTimeDays = Math.max(0, req.getCommonDataInt('leadTimeDays', 0));
      }

      if(data.cateringPrice !== undefined){
        if(data.cateringPrice === null || data.cateringPrice === 'null' || data.cateringPrice === ''){
          updateData.cateringPrice = null;
        } else {
          const price = +(+data.cateringPrice).toFixed(2);
          if(!App.isPosNumber(price)){
            return App.json(res, 417, App.t(['field','[cateringPrice]','must-be','a-positive-number'], req.lang));
          }
          updateData.cateringPrice = price;
        }
      }

      if(data.isAvailableForCatering !== undefined){
        updateData.isAvailableForCatering = App.getBoolFromValue(data.isAvailableForCatering);
      }

      // Update
      if(Object.keys(updateData).length > 0){
        await cateringMenuItem.update(updateData);
      }

      // Reload with menu item
      const result = await CateringMenuItem.findOne({
        where: { id: cateringMenuItem.id },
        include: [{
          model: MenuItem,
          as: 'MenuItem',
          attributes: ['id', 'name', 'description', 'image', 'price', 'isAvailable']
        }]
      });

      return App.json(res, true, App.t('success', req.lang), result);

    }catch(e){
      console.log(e);
      return App.json(res, false, App.t('error', req.lang));
    }

  });

  return { router, method: 'post', autoDoc:{} };

};
