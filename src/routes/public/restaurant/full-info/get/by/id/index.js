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
            through: { attributes: [] }, // Exclude junction table fields
            attributes: ['id', 'name', 'slug', 'description', 'image'],
            where: { isActive: true },
            required: false
          }
        ]
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

  let deliveryCoords = null;

  // Try to get delivery coordinates from default address if client exists
  if (App.isObject(mClient) && App.isPosNumber(mClient.id)) {
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
  }

  // Fallback to user coordinates if no default address found
  if (!deliveryCoords && App.isObject(mUser) && mUser.lat && mUser.lon) {
    deliveryCoords = { lat: mUser.lat, lon: mUser.lon };
  }

  // Fallback to request info coordinates
  if (!deliveryCoords && res.info.lat && res.info.lon) {
    deliveryCoords = { lat: res.info.lat, lon: res.info.lon };
  }

  // Calculate distance if we have coordinates
  if (deliveryCoords) {
    const distRes = App.geo.lib.getDistance(deliveryCoords, mRestaurant, mDeliveryPriceSettings.unitType || 'miles');
    if (distRes.success) {
      mRestaurant.dataValues.distance = distRes.data.distance;
      mRestaurant.dataValues.distanceType = distRes.data.units;
    }
  }
}

      mRestaurant.dataValues.State = mRestaurant.City.State;
      delete mRestaurant.City.dataValues.State;

      const mWorkingTime = await App.getModel('RestaurantWorkingTime')
        .getAsObjectByRestaurantId(mRestaurant.id);

      // Get order type settings for the restaurant
      const orderTypeSettings = await App.getModel('RestaurantOrderTypeSettings').findAll({
        where: {
          restaurantId: mRestaurant.id,
          isEnabled: true,
        },
        attributes: [
          'id', 'orderType', 'isEnabled', 'pricingModel',
          'basePrice', 'pricePerPerson', 'pricePerHour',
          'minPeople', 'maxPeople', 'minHours', 'maxHours',
          'serviceFeePercentage'
        ],
        order: [['orderType', 'ASC']]
      });

      // Get unavailable dates (next 90 days)
      const today = new Date().toISOString().split('T')[0];
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 90);
      const maxDate = futureDate.toISOString().split('T')[0];

      const unavailableDates = await App.getModel('RestaurantUnavailableDates').findAll({
        where: {
          restaurantId: mRestaurant.id,
          unavailableDate: {
            [App.DB.Op.gte]: today,
            [App.DB.Op.lte]: maxDate,
          }
        },
        attributes: ['id', 'unavailableDate', 'reason', 'isFullDayBlocked', 'blockedFromTime', 'blockedToTime'],
        order: [['unavailableDate', 'ASC']]
      });

      // Format order type settings
      const supportedOrderTypes = orderTypeSettings.map(setting => ({
        orderType: setting.orderType,
        pricingModel: setting.pricingModel || null,
        basePrice: setting.basePrice ? parseFloat(setting.basePrice) : null,
        pricePerPerson: setting.pricePerPerson ? parseFloat(setting.pricePerPerson) : null,
        pricePerHour: setting.pricePerHour ? parseFloat(setting.pricePerHour) : null,
        minPeople: setting.minPeople || null,
        maxPeople: setting.maxPeople || null,
        minHours: setting.minHours || null,
        maxHours: setting.maxHours || null,
        serviceFeePercentage: setting.serviceFeePercentage ? parseFloat(setting.serviceFeePercentage) : null,
      }));

      // Format unavailable dates
      const formattedUnavailableDates = unavailableDates.map(date => ({
        date: date.unavailableDate,
        reason: date.reason || null,
        isFullDayBlocked: date.isFullDayBlocked,
        blockedFromTime: date.blockedFromTime || null,
        blockedToTime: date.blockedToTime || null,
      }));

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
        supportedOrderTypes: supportedOrderTypes,
        unavailableDates: formattedUnavailableDates,
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


