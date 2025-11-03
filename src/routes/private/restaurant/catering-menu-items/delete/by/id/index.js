const express = require('express');
const router = express.Router();

/*
Delete (soft delete) a catering menu item
{
  "cateringMenuItemId": "required: <number>"
}
*/

// POST /private/restaurant/catering-menu-items/delete/by/id

module.exports = function(App, RPath){

  router.use('', async(req, res)=>{

    try{

      const mUser = await req.user;
      const mRestaurant = await req.restaurant;

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
            restaurantId: mRestaurant.id
          },
          required: true
        }]
      });

      if(!cateringMenuItem){
        return App.json(res, 404, App.t(['Catering-Menu-Item','not','found'], req.lang));
      }

      // Soft delete
      await cateringMenuItem.update({
        isDeleted: true,
        deletedAt: App.getISODate()
      });

      return App.json(res, true, App.t('success', req.lang), {
        id: cateringMenuItem.id,
        isDeleted: true
      });

    }catch(e){
      console.log(e);
      return App.json(res, false, App.t('error', req.lang));
    }

  });

  return { router, method: 'post', autoDoc:{} };

};
