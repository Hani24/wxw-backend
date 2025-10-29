const express = require('express');
const router = express.Router();

/*
Add or update a menu item for catering availability
{
  "menuItemId": "required: <number> Ref. MenuItem.id",
  "feedsPeople": "required: <number> How many people this item feeds",
  "minimumQuantity": "optional: <number> default: 1",
  "leadTimeDays": "optional: <number> default: 0 - Days advance notice required",
  "cateringPrice": "optional: <float> Catering-specific price (null = use regular price)",
  "isAvailableForCatering": "optional: <boolean> default: true"
}
*/

// POST /private/restaurant/catering-menu-items/add

module.exports = function(App, RPath){

  router.use('', async(req, res)=>{

    try{

      const mUser = await req.user;
      const mRestaurant = await req.restaurant;
      const data = req.getPost();

      // Get menu item ID
      const menuItemId = req.getCommonDataInt('menuItemId', null);
      if(!App.isPosNumber(menuItemId)){
        return App.json(res, 417, App.t(['field','[menuItemId]','is-required'], req.lang));
      }

      // Verify menu item exists and belongs to this restaurant
      const MenuItem = App.getModel('MenuItem');
      const menuItem = await MenuItem.findOne({
        where: {
          id: menuItemId,
          restaurantId: mRestaurant.id,
          isDeleted: false
        }
      });

      if(!menuItem){
        return App.json(res, 404, App.t(['Menu-Item','not','found'], req.lang));
      }

      // Validate feedsPeople
      const feedsPeople = req.getCommonDataInt('feedsPeople', null);
      if(!App.isPosNumber(feedsPeople) || feedsPeople < 1){
        return App.json(res, 417, App.t(['field','[feedsPeople]','must-be','greater-than','0'], req.lang));
      }

      // Optional fields
      const minimumQuantity = Math.max(1, req.getCommonDataInt('minimumQuantity', 1));
      const leadTimeDays = Math.max(0, req.getCommonDataInt('leadTimeDays', 0));
      const isAvailableForCatering = App.getBoolFromValue(req.getCommonDataString('isAvailableForCatering', true));

      // Optional catering price
      let cateringPrice = null;
      if(data.cateringPrice && data.cateringPrice !== 'null' && data.cateringPrice !== ''){
        cateringPrice = App.isPosNumber(+(+data.cateringPrice).toFixed(2))
          ? +(+data.cateringPrice).toFixed(2)
          : null;
      }

      const cateringData = {
        menuItemId,
        feedsPeople,
        minimumQuantity,
        leadTimeDays,
        cateringPrice,
        isAvailableForCatering,
        isDeleted: false,
        deletedAt: null
      };

      const CateringMenuItem = App.getModel('CateringMenuItem');

      // Check if already exists
      let cateringMenuItem = await CateringMenuItem.findOne({
        where: { menuItemId }
      });

      if(cateringMenuItem){
        // Update existing
        await cateringMenuItem.update(cateringData);
      } else {
        // Create new
        cateringMenuItem = await CateringMenuItem.create(cateringData);
      }

      if(!App.isObject(cateringMenuItem) || !App.isPosNumber(cateringMenuItem.id)){
        return App.json(res, 500, App.t(['failed-to','save','Catering-Menu-Item'], req.lang));
      }

      // Load full data with menu item
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
