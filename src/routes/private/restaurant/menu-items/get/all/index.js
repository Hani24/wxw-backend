const express = require('express');
const router = express.Router();

/*
Get all menu items for the restaurant
Returns all menu items grouped by category
*/

// POST /private/restaurant/menu-items/get/all

module.exports = function(App, RPath){

  router.use('', async(req, res)=>{

    try{

      const mRestaurant = await req.restaurant;

      // Get all menu categories with their menu items for this restaurant
      const MenuCategory = App.getModel('MenuCategory');
      const MenuItem = App.getModel('MenuItem');

      const categories = await MenuCategory.findAll({
        where: {
          restaurantId: mRestaurant.id,
          isDeleted: false,
        },
        attributes: ['id', 'name', 'description', 'order'],
        include: [{
          model: MenuItem,
          where: {
            isDeleted: false,
          },
          required: false, // Include categories even if they have no items
          attributes: [
            'id', 'image', 'name', 'description', 'kcal', 'proteins',
            'fats', 'carbs', 'price', 'rating', 'isAvailable', 'order', 'updatedAt'
          ],
        }],
        order: [
          ['order', 'ASC'],
          [MenuItem, 'order', 'ASC']
        ]
      });

      // Format response
      const formattedCategories = categories.map(category => ({
        id: category.id,
        name: category.name,
        description: category.description,
        order: category.order,
        items: category.MenuItems.map(item => ({
          id: item.id,
          image: item.image,
          name: item.name,
          description: item.description,
          kcal: item.kcal,
          proteins: item.proteins,
          fats: item.fats,
          carbs: item.carbs,
          price: parseFloat(item.price),
          rating: item.rating,
          isAvailable: item.isAvailable,
          order: item.order,
          updatedAt: item.updatedAt
        }))
      }));

      // Calculate totals
      const totalCategories = formattedCategories.length;
      const totalItems = formattedCategories.reduce((sum, cat) => sum + cat.items.length, 0);

      return App.json(res, true, App.t('success', req.lang), {
        categories: formattedCategories,
        totalCategories,
        totalItems
      });

    }catch(e){
      console.log(e);
      App.onRouteError(req, res, e);
    }

  });

  return { router, method: 'post', autoDoc:{} };

};
