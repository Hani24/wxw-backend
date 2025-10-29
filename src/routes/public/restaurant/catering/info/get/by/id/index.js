const express = require('express');
const router = express.Router();

/*
Get restaurant catering information including menu items
{
  "id": "required: <number> Ref. Restaurant.id"
}
*/

// GET /public/restaurant/catering/info/get/by/id/:id

module.exports = function(App, RPath){

  router.use('', async(req, res)=>{

    try{

      const mUser = await req.user;
      const mClient = await req.client;

      const id = req.getCommonDataInt('id', null);

      if(!App.isPosNumber(id)){
        return App.json(res, 417, App.t(['Restaurant','id','is-required'], req.lang));
      }

      // Get restaurant basic info
      const Restaurant = App.getModel('Restaurant');
      const mRestaurant = await Restaurant.findOne({
        where: {
          id,
          isVerified: true,
          isRestricted: false,
        },
        attributes: [
          'id', 'image', 'name', 'description', 'zip', 'street',
          'rating', 'type', 'lat', 'lon', 'isOpen', 'createdAt'
        ],
        include: [
          {
            model: App.getModel('City'),
            attributes: ['id', 'name'],
            required: true,
            include: [{
              model: App.getModel('State'),
              attributes: ['id', 'name', 'code']
            }]
          },
          {
            model: App.getModel('CuisineType'),
            through: { attributes: [] },
            attributes: ['id', 'name', 'slug', 'image'],
            where: { isActive: true },
            required: false
          }
        ]
      });

      if(!App.isObject(mRestaurant) || !App.isPosNumber(mRestaurant.id)){
        return App.json(res, 404, App.t(['Restaurant','not','found'], req.lang));
      }

      // Check if restaurant has catering enabled
      const RestaurantOrderTypeSettings = App.getModel('RestaurantOrderTypeSettings');
      const cateringSettings = await RestaurantOrderTypeSettings.findOne({
        where: {
          restaurantId: mRestaurant.id,
          orderType: 'catering',
          isEnabled: true
        }
      });

      if(!cateringSettings){
        return App.json(res, 404, App.t(['Restaurant','does-not','offer','catering'], req.lang));
      }

      // Get catering menu items
      const CateringMenuItem = App.getModel('CateringMenuItem');
      const MenuItem = App.getModel('MenuItem');
      const MenuCategory = App.getModel('MenuCategory');

      const cateringItems = await CateringMenuItem.findAll({
        where: {
          isDeleted: false,
          isAvailableForCatering: true
        },
        include: [{
          model: MenuItem,
          as: 'MenuItem',
          where: {
            restaurantId: mRestaurant.id,
            isAvailable: true,
            isDeleted: false
          },
          required: true,
          attributes: [
            'id', 'name', 'description', 'image', 'price',
            'kcal', 'proteins', 'fats', 'carbs', 'rating', 'totalRatings'
          ],
          include: [{
            model: MenuCategory,
            as: 'MenuCategory',
            attributes: ['id', 'name', 'order'],
            required: false
          }]
        }],
        order: [
          [MenuItem, MenuCategory, 'order', 'ASC'],
          [MenuItem, 'order', 'ASC']
        ]
      });

      // Get unavailable dates (next 90 days)
      const today = new Date().toISOString().split('T')[0];
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 90);
      const maxDate = futureDate.toISOString().split('T')[0];

      const RestaurantUnavailableDates = App.getModel('RestaurantUnavailableDates');
      const unavailableDates = await RestaurantUnavailableDates.findAll({
        where: {
          restaurantId: mRestaurant.id,
          unavailableDate: {
            [App.DB.Op.gte]: today,
            [App.DB.Op.lte]: maxDate
          }
        },
        attributes: ['unavailableDate', 'reason'],
        order: [['unavailableDate', 'ASC']]
      });

      // Format menu items by category
      const menuByCategory = {};
      const categoryOrder = [];

      cateringItems.forEach(item => {
        const categoryName = item.MenuItem.MenuCategory ? item.MenuItem.MenuCategory.name : 'Uncategorized';
        const categoryId = item.MenuItem.MenuCategory ? item.MenuItem.MenuCategory.id : 0;
        const categoryOrderIndex = item.MenuItem.MenuCategory ? item.MenuItem.MenuCategory.order : 999;

        if(!menuByCategory[categoryName]){
          menuByCategory[categoryName] = {
            categoryId,
            categoryName,
            categoryOrder: categoryOrderIndex,
            items: []
          };
          categoryOrder.push(categoryName);
        }

        // Calculate effective price (catering price or regular price)
        const effectivePrice = item.cateringPrice || item.MenuItem.price;

        // Calculate average rating
        const avgRating = item.MenuItem.totalRatings > 0
          ? (item.MenuItem.rating / item.MenuItem.totalRatings).toFixed(2)
          : 0;

        menuByCategory[categoryName].items.push({
          cateringMenuItemId: item.id,
          menuItemId: item.menuItemId,
          name: item.MenuItem.name,
          description: item.MenuItem.description,
          image: item.MenuItem.image,
          price: effectivePrice,
          regularPrice: item.MenuItem.price,
          feedsPeople: item.feedsPeople,
          minimumQuantity: item.minimumQuantity,
          leadTimeDays: item.leadTimeDays,
          nutritionalInfo: {
            kcal: item.MenuItem.kcal,
            proteins: item.MenuItem.proteins,
            fats: item.MenuItem.fats,
            carbs: item.MenuItem.carbs
          },
          rating: parseFloat(avgRating),
          totalRatings: item.MenuItem.totalRatings
        });
      });

      // Convert to array and sort by category order
      const menuCategories = categoryOrder.map(catName => menuByCategory[catName])
        .sort((a, b) => a.categoryOrder - b.categoryOrder);

      // Calculate minimum lead time across all items
      const minimumLeadTimeDays = cateringItems.length > 0
        ? Math.max(...cateringItems.map(item => item.leadTimeDays || 0), 10) // Minimum 10 days for catering
        : 10;

      // Format restaurant data
      const restaurantData = {
        id: mRestaurant.id,
        name: mRestaurant.name,
        description: mRestaurant.description,
        image: mRestaurant.image,
        rating: mRestaurant.rating,
        type: mRestaurant.type,
        address: {
          street: mRestaurant.street,
          zip: mRestaurant.zip,
          city: mRestaurant.City ? mRestaurant.City.name : '',
          state: mRestaurant.City && mRestaurant.City.State ? mRestaurant.City.State.name : '',
          stateCode: mRestaurant.City && mRestaurant.City.State ? mRestaurant.City.State.code : ''
        },
        location: {
          lat: mRestaurant.lat,
          lon: mRestaurant.lon
        },
        cuisineTypes: mRestaurant.CuisineTypes || [],
        isOpen: mRestaurant.isOpen
      };

      // Response data
      const responseData = {
        restaurant: restaurantData,
        cateringSettings: {
          isEnabled: true,
          minimumLeadTimeDays,
          serviceFeePercentage: cateringSettings.serviceFeePercentage || 15,
          pricingModel: 'per-item' // Catering uses per-item pricing
        },
        deliveryOptions: ['pickup', 'drop-off'],
        unavailableDates: unavailableDates.map(d => ({
          date: d.unavailableDate,
          reason: d.reason
        })),
        menuCategories,
        totalItems: cateringItems.length
      };

      return App.json(res, true, App.t('success', req.lang), responseData);

    }catch(e){
      console.log(e);
      return App.json(res, false, App.t('error', req.lang));
    }

  });

  return { router, method: 'post', autoDoc:{} };

};
