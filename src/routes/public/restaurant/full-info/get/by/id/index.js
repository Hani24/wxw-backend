const express = require('express');
const router = express.Router();

/*
{
  "id": "required: <number> Ref. Restaurant.id"
}
*/

// /public/restaurant/full-info/get/by/id/:id

module.exports = function (App, RPath) {

  router.use('', async (req, res) => {

    try {

      const mUser = await req.user;
      const mClient = await req.client;

      const data = req.getPost();
      const id = req.getCommonDataInt('id', null);
      console.debug({ id });

      if (App.isNull(id))
        return App.json(res, 417, App.t(['Restaurant', 'id', 'is-required'], req.lang));

      const mRestaurant = await App.getModel('Restaurant').findOne({
        where: {
          id,
          isVerified: true,
          isRestricted: false,
        },
        attributes: [
          'id', 'image', 'name', 'description', 'zip', 'street', 'rating',
          'type', 'lat', 'lon', 'isOpen', 'createdAt',
          'shareableLink'
          //,'updatedAt',
        ],
        include: [{
          model: App.getModel('City'),
          attributes: ['id', 'name'],
          required: true,
          include: [{
            model: App.getModel('State'),
            attributes: ['id', 'name', 'code']
          }]
        }]
      });

      if (!App.isObject(mRestaurant) || !App.isPosNumber(mRestaurant.id))
        return App.json(res, 404, App.t(['Restaurant', 'id', 'not-found'], req.lang));

      mRestaurant.dataValues.distance = 0;
      mRestaurant.dataValues.distanceType = '';

    //  if (App.isObject(mUser) || (res.info.lat && res.info.lon)) {
    //    const { unitType } = await App.getModel('DeliveryPriceSettings').getSettings();
    //    const mFrom = App.isObject(mUser) ? mUser : res.info;
    //    const distRes = App.geo.lib.getDistance(mFrom, mRestaurant, unitType || 'miles');
    //    if (distRes.success) {
    //      mRestaurant.dataValues.distance = distRes.data.distance;
    //      mRestaurant.dataValues.distanceType = distRes.data.units;
     //   }
     // }
	  if (App.isObject(mUser) || (res.info.lat && res.info.lon)) {
  const mDeliveryPriceSettings = await App.getModel('DeliveryPriceSettings').getSettings();
  
  let deliveryCoords = { lat: mUser.lat, lon: mUser.lon }; // Default to user's coordinates
  
  const defaultAddress = await App.getModel('DeliveryAddress').findOne({
    where: {
      clientId: mClient.id,
      isDefault: true,
      isDeleted: false,
    },
  });
  
  if (defaultAddress) {
    deliveryCoords = {
      lat: defaultAddress.lat,
      lon: defaultAddress.lon,
    };
  }
  
  const distRes = App.geo.lib.getDistance(deliveryCoords, mRestaurant, mDeliveryPriceSettings.unitType || 'miles');
  if (distRes.success) {
    mRestaurant.dataValues.distance = distRes.data.distance;
    mRestaurant.dataValues.distanceType = distRes.data.units;
  }
}

      mRestaurant.dataValues.State = mRestaurant.City.State;
      delete mRestaurant.City.dataValues.State;

      const mWorkingTime = await App.getModel('RestaurantWorkingTime')
        .getAsObjectByRestaurantId(mRestaurant.id);

      // Get menu categories and items
      // Set up includes for menu items
      const includeMenuItem = [];
      if (App.isObject(mClient) && App.isPosNumber(mClient.id)) {
        includeMenuItem.push({
          model: App.getModel('FavoriteMenuItem'),
          attributes: ['id'],
          where: { clientId: mClient.id },
          required: false,
        });

        const mCart = await App.getModel('Cart').getByClientId(mClient.id);
        if (App.isObject(mCart) && App.isPosNumber(mCart.id)) {
          includeMenuItem.push({
            model: App.getModel('CartItem'),
            attributes: ['id', 'amount'],
            where: {
              cartId: mCart.id,
            },
            required: false,
          });
        }
      }

     // Get menu categories with items
      const mMenuCategories = await App.getModel('MenuCategory').findAll({
        where: {
          restaurantId: mRestaurant.id,
          isDeleted: false,
        },
        attributes: ['id', 'name', 'description', 'order'],
        order: [['order', 'asc']],
        include: [{
          model: App.getModel('MenuItem'),
          required: true, // show only MenuCategory where at least one MenuItem isAvailable
          attributes: [
            'id', 'name', 'image', 'description', 'order', 'kcal', 'proteins',
            'fats', 'carbs', 'price', 'rating', 'createdAt',
          ],
          where: {
            isAvailable: true,
            isDeleted: false,
          },
          include: includeMenuItem,
        }]
      });

  // Process menu categories and items
      const processedMenuCategories = (App.isArray(mMenuCategories) ? mMenuCategories : [])
        .map((MenuCategory) => {
          // Sort menu items by order
          MenuCategory.MenuItems = MenuCategory.MenuItems
            .sort((a, b) => ((a.order > b.order) ? 1 : -1));

          // Process each menu item
          if (App.isArray(MenuCategory.MenuItems) && MenuCategory.MenuItems.length) {
            for (const mMenuItem of MenuCategory.MenuItems) {
              // Set favorite status
              mMenuItem.dataValues.isFavorite = App.isObject(mMenuItem.FavoriteMenuItem);

              // Set cart amount
              mMenuItem.dataValues.amountInCart = 0;
              if (App.isArray(mMenuItem.CartItems) && (!!mMenuItem.CartItems.length)) {
                mMenuItem.dataValues.amountInCart = mMenuItem.CartItems[0].amount;
              }

              // Clean up internal fields
              delete mMenuItem.dataValues.CartItems;
              delete mMenuItem.dataValues.FavoriteMenuItem;
            }
          }
          return MenuCategory;
        });


      // console.json({ mWorkingTime });

      App.json(res, true, App.t(['success'], res.lang), {
        info: mRestaurant,
        workingTime: mWorkingTime,
	MenuCategories: processedMenuCategories,
      });

    } catch (e) {
      console.log(e);
      App.onRouteError(req, res, e);
      // App.json( res, false, App.t('request-could-not-be-processed', req.lang) );
    }

  });

  return { router, method: '', autoDoc: {} };

};


