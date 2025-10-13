const express = require('express');
const router = express.Router();
module.exports = function(App, RPath){
  router.use('', async(req, res)=>{
    try{
      const mUser = await req.user;
      const mClient = await req.client;
      const data = req.getPost();
      const {offset, limit, order, by} = req.getPagination({});
      const orderBy = App.getModel('Restaurant').getOrderBy(by);
      const restaurantTypes = App.getModel('Restaurant').getTypes({asArray: true});
      
      // Base restaurant criteria
      const restaurantWhere = {
        isVerified: true,
        isRestricted: false,
        isOpeningHoursSet: true,
        isKycCompleted: true,
      };
      
      // Parse filters from request
      const filters = {
        searchNearByMe: App.getBooleanFromValue(data.searchNearByMe),
        isOpen: App.getBooleanFromValue(data.isOpen) || null,
        type: req.getCommonDataString('type', null),
        name: App.tools.stripSpecialChars(req.getCommonDataString('name', '')).substr(0, 64),
      };
      console.json({filters});
      
      // Apply additional filters if specified
      if(App.isBoolean(filters.isOpen) && filters.isOpen)
        restaurantWhere['isOpen'] = true;
      if(App.isString(filters.type) && restaurantTypes.includes(filters.type))
        restaurantWhere['type'] = filters.type;
      if(App.isString(filters.name) && filters.name.length >= 1)
        restaurantWhere['name'] = { [App.DB.Op.like]: `%${filters.name}%` };
      
      console.json({mUser});
      console.json({mClient});
      
      // Initialize search coordinates to null
      let searchCoords = null;
      
      // Process proximity search
      if(filters.searchNearByMe && 
         ((App.isObject(mUser) && App.isPosNumber(mUser.id)) || App.isObject(res.info))) {
        
        // Get search settings
        const mSearchNearByClientSettings = await App.getModel('SearchNearByClientSettings').getSettings(false);
        
        if(App.isObject(mSearchNearByClientSettings) && App.isPosNumber(mSearchNearByClientSettings.id)) {
          // Get default delivery address
          const defaultAddress = await App.getModel('DeliveryAddress').findOne({
            where: {
              clientId: mClient.id,
              isDefault: true,
              isDeleted: false,
            },
          });
          
          console.log(defaultAddress);
          
          // Determine coordinates source
          if(defaultAddress && defaultAddress.lat && defaultAddress.lon) {
            searchCoords = {
              lat: defaultAddress.lat,
              lon: defaultAddress.lon
            };
          } else if(App.isObject(res.info) && res.info.lat && res.info.lon) {
            searchCoords = {
              lat: res.info.lat,
              lon: res.info.lon
            };
            console.log('No default delivery address found for this user.');
          }
          
          console.log({ mUser, resInfo: res.info });
          console.log(searchCoords);
        }
      }
      
      // Execute the restaurant query
      let mRestaurants;
      const mDeliveryPriceSettings = await App.getModel('DeliveryPriceSettings').getSettings();
      
      if(searchCoords && searchCoords.lat && searchCoords.lon) {
        // Get radius in miles from settings (default 25 miles)
        const mSearchNearByClientSettings = await App.getModel('SearchNearByClientSettings').getSettings(false);
        const radiusInMiles = mSearchNearByClientSettings.maxSearchRadius || 25;
        
        // Execute a raw SQL query to find restaurants within radius
        const [restaurants] = await App.DB.sequelize.query(`
          SELECT 
            r.id, r.name, r.image, r.zip, r.street,
            r.rating, r.type, r.lat, r.lon, r.isOpen,
            (
              3959 * acos(
                cos(radians(${searchCoords.lat})) * 
                cos(radians(r.lat)) * 
                cos(radians(r.lon) - radians(${searchCoords.lon})) + 
                sin(radians(${searchCoords.lat})) * 
                sin(radians(r.lat))
              )
            ) AS calculatedDistance
          FROM 
            Restaurants r
          WHERE 
            r.isVerified = true
            AND r.isRestricted = false
            AND r.isOpeningHoursSet = true
            AND r.isKycCompleted = true
            ${App.isBoolean(filters.isOpen) && filters.isOpen ? 'AND r.isOpen = true' : ''}
            ${App.isString(filters.type) && restaurantTypes.includes(filters.type) ? `AND r.type = '${filters.type}'` : ''}
            ${App.isString(filters.name) && filters.name.length >= 1 ? `AND r.name LIKE '%${filters.name}%'` : ''}
            AND (
              3959 * acos(
                cos(radians(${searchCoords.lat})) * 
                cos(radians(r.lat)) * 
                cos(radians(r.lon) - radians(${searchCoords.lon})) + 
                sin(radians(${searchCoords.lat})) * 
                sin(radians(r.lat))
              )
            ) <= ${radiusInMiles}
            AND EXISTS (
              SELECT 1 FROM MenuCategories mc
              WHERE mc.restaurantId = r.id
                AND mc.isDeleted = false
                AND EXISTS (
                  SELECT 1 FROM MenuItems mi
                  WHERE mi.menuCategoryId = mc.id
                    AND mi.isAvailable = true
                    AND mi.isDeleted = false
                )
            )
          ORDER BY calculatedDistance ASC
          LIMIT ${limit} OFFSET ${offset}
        `);
        
        // Get total count using a separate query
        const [countResult] = await App.DB.sequelize.query(`
          SELECT COUNT(*) as total
          FROM 
            Restaurants r
          WHERE 
            r.isVerified = true
            AND r.isRestricted = false
            AND r.isOpeningHoursSet = true
            AND r.isKycCompleted = true
            ${App.isBoolean(filters.isOpen) && filters.isOpen ? 'AND r.isOpen = true' : ''}
            ${App.isString(filters.type) && restaurantTypes.includes(filters.type) ? `AND r.type = '${filters.type}'` : ''}
            ${App.isString(filters.name) && filters.name.length >= 1 ? `AND r.name LIKE '%${filters.name}%'` : ''}
            AND (
              3959 * acos(
                cos(radians(${searchCoords.lat})) * 
                cos(radians(r.lat)) * 
                cos(radians(r.lon) - radians(${searchCoords.lon})) + 
                sin(radians(${searchCoords.lat})) * 
                sin(radians(r.lat))
              )
            ) <= ${radiusInMiles}
            AND EXISTS (
              SELECT 1 FROM MenuCategories mc
              WHERE mc.restaurantId = r.id
                AND mc.isDeleted = false
                AND EXISTS (
                  SELECT 1 FROM MenuItems mi
                  WHERE mi.menuCategoryId = mc.id
                    AND mi.isAvailable = true
                    AND mi.isDeleted = false
                )
            )
        `);
        
        // Get menu categories for each restaurant
        let restaurantsWithCategories = [];
        for (const restaurant of restaurants) {
          // Query menu categories for this restaurant
          const [categories] = await App.DB.sequelize.query(`
            SELECT id, name
            FROM MenuCategories
            WHERE restaurantId = ${restaurant.id}
            AND isDeleted = false
            AND EXISTS (
              SELECT 1 FROM MenuItems
              WHERE menuCategoryId = MenuCategories.id
              AND isAvailable = true
              AND isDeleted = false
            )
          `);
          
          // Format restaurant with S3 URL and proper distance format
          const formattedRestaurant = {
            image: App.S3.getUrlByName(restaurant.image),
            shareableLink: `https://api.wxwdelivery.com/public/share/restaurant/by/id/${restaurant.id}`,
            id: restaurant.id,
            name: restaurant.name,
            zip: restaurant.zip,
            street: restaurant.street,
            rating: restaurant.rating,
            type: restaurant.type,
            lat: restaurant.lat,
            lon: restaurant.lon,
            isOpen: restaurant.isOpen === 1,
            MenuCategories: categories,
            distance: parseFloat(restaurant.calculatedDistance.toFixed(2)),
            distanceType: "mile"
          };
          
          restaurantsWithCategories.push(formattedRestaurant);
        }
        
        // Format the results to match Sequelize's findAndCountAll format
        mRestaurants = {
          count: countResult[0].total,
          rows: restaurantsWithCategories
        };
        
      } else {
        // If no proximity search, use standard Sequelize query
        mRestaurants = await App.getModel('Restaurant').findAndCountAll({
          where: restaurantWhere,
          distinct: true,
          attributes: [
            'id', 'name', 'image', 'zip', 'street',
            'rating', 'type', 'lat', 'lon', 'isOpen', 'shareableLink'
          ],
          include: [{
            required: true,
            model: App.getModel('MenuCategory'),
            where: {
              isDeleted: false,
            },
            attributes: ['id', 'name'],
            include: [{
              required: true,
              model: App.getModel('MenuItem'),
              where: {
                isAvailable: true,
                isDeleted: false,
              },
              attributes: [],
            }],
          }],
          order: [[orderBy, order]],
          offset: offset,
          limit: limit,
        });

        // Initialize distance fields and format image URLs
        if(App.isArray(mRestaurants.rows) && mRestaurants.rows.length) {
          for(const mRestaurant of mRestaurants.rows) {
            if(App.isObject(mRestaurant) && App.isPosNumber(mRestaurant.id)) {
              // Format image URL
              mRestaurant.image = App.S3.getUrlByName(mRestaurant.image);
              
              // Initialize distance values
              mRestaurant.dataValues.distance = 0;
              mRestaurant.dataValues.distanceType = 'mile';
              
              // Calculate distance if user coordinates are available
              if(searchCoords && searchCoords.lat && searchCoords.lon) {
                const distRes = App.geo.lib.getDistance(searchCoords, mRestaurant, mDeliveryPriceSettings.unitType);
                if(distRes.success) {
                  mRestaurant.dataValues.distance = distRes.data.distance;
                  mRestaurant.dataValues.distanceType = 'mile';
                }
              }
            }
          }
        }
      }
      
      // Return the response
      App.json(res, true, App.t('success', res.lang), mRestaurants);
      
    } catch(e) {
      console.log(e);
      App.onRouteError(req, res, e);
    }
  });
  return { router, method: '', autoDoc:{} };
};
