const express = require('express');
const router = express.Router();

/*
Get all catering menu items for the restaurant
Returns menu items with catering details
*/

// GET /private/restaurant/catering-menu-items/get

module.exports = function(App, RPath){

  router.use('', async(req, res)=>{

    try{

      const mUser = await req.user;
      const mRestaurant = await req.restaurant;

      const MenuItem = App.getModel('MenuItem');
      const MenuCategory = App.getModel('MenuCategory');
      const CateringMenuItem = App.getModel('CateringMenuItem');

      // Get all catering menu items for this restaurant
      const cateringItems = await CateringMenuItem.findAll({
        where: {
          isDeleted: false
        },
        include: [{
          model: MenuItem,
          as: 'MenuItem',
          where: {
            restaurantId: mRestaurant.id,
            isDeleted: false
          },
          required: true,
          include: [{
            model: MenuCategory,
            as: 'MenuCategory',
            attributes: ['id', 'name']
          }]
        }],
        order: [
          [MenuItem, MenuCategory, 'order', 'ASC'],
          [MenuItem, 'order', 'ASC']
        ]
      });

      // Format response
      const formattedItems = cateringItems.map(item => ({
        id: item.id,
        menuItemId: item.menuItemId,
        feedsPeople: item.feedsPeople,
        minimumQuantity: item.minimumQuantity,
        cateringPrice: item.cateringPrice,
        isAvailableForCatering: item.isAvailableForCatering,
        menuItem: {
          id: item.MenuItem.id,
          name: item.MenuItem.name,
          description: item.MenuItem.description,
          image: item.MenuItem.image,
          price: item.MenuItem.price,
          isAvailable: item.MenuItem.isAvailable,
          kcal: item.MenuItem.kcal,
          proteins: item.MenuItem.proteins,
          fats: item.MenuItem.fats,
          carbs: item.MenuItem.carbs,
          category: item.MenuItem.MenuCategory ? {
            id: item.MenuItem.MenuCategory.id,
            name: item.MenuItem.MenuCategory.name
          } : null
        },
        effectivePrice: item.cateringPrice || item.MenuItem.price,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt
      }));

      return App.json(res, true, App.t('success', req.lang), formattedItems);

    }catch(e){
      console.log(e);
      return App.json(res, false, App.t('error', req.lang));
    }

  });

  return { router, method: 'get', autoDoc:{} };

};
