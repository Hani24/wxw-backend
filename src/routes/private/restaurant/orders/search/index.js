const express = require('express');
const router = express.Router();
// {
//   "search": "required: <string>: [ order-id, order-status, menu-item name, price, etc ... clients: phone, email ]",
//   "searchInCanceled": "optional: <boolean>: default: false"
// }
// /private/restaurant/orders/search/?offset=0&limit=15&order=asc&by=id
module.exports = function(App, RPath){
  router.use('', async(req, res)=>{
    try{
      const data = req.getPost();
      const mUser = await req.user;
      const mRestaurant = await req.restaurant;
      const {offset, limit, order, by} = req.getPagination({order: 'asc'});
      const orderBy = App.getModel('Order').getOrderBy(by);
      const statuses = App.getModel('Order').getStatuses();
      const search = App.isString( req.getCommonDataString('search', null) )
        ? App.tools.stripSpecialChars( req.getCommonDataString('search', null) ).substr(0,250)
        : false;
      const searchInCanceled = !App.isUndefined(data.searchInCanceled)
        ? App.getBoolFromValue(data.searchInCanceled)
        : false;
      if( !App.isString(search) || !search.length )
        return App.json( res, 417, App.t(['search','is-required'], req.lang) );
      
      // [user]
      const email = App.tools.normalizeEmail( search );
      const phone = App.tools.cleanPhone( search ) === '+' ? null : App.tools.cleanPhone( search );
      const float = App.getNumber(search, {floor: false, abs: true});
      const int = App.getNumber(search, {floor: true, abs: true});
      const firstName = search.split(' ').length >= 1 ? search.split(' ')[0] : null;
      const lastName = search.split(' ').length >= 2 ? search.split(' ')[1] : null;
      console.debug({email, phone, firstName, lastName, float, int,});

      // Define possible statuses based on searchInCanceled parameter
      const statusAsOption = [
        statuses.processing,
        statuses.refunded,
        statuses.delivered,
      ];
      
      if(searchInCanceled) {
        statusAsOption.push(statuses.canceled);
        statusAsOption.push(statuses.discarded);
      }

      // Initialize empty result
      let mRestaurantOrders = { count: 0, rows: [] };
      
      // Try to find by client info (email, phone, name)
      try {
        // Use getAllOrdersWhere with client filter
        mRestaurantOrders = await App.getModel('Restaurant').getAllOrdersWhere(
          {
            status: {
              [ App.DB.Op.or ]: statusAsOption
            },
            '$Client.User.firstName$': { [App.DB.Op.like]: `%${firstName}%` },
            '$Client.User.lastName$': { [App.DB.Op.like]: `%${lastName}%` },
            '$Client.User.email$': { [App.DB.Op.like]: `%${search.toLowerCase()}%` },
            '$Client.User.phone$': { [App.DB.Op.like]: `%${search.toLowerCase()}%` }
          },
          {
            restaurantId: mRestaurant.id,
          }, 
          { offset, limit, order, orderBy }
        );

        if(mRestaurantOrders.count > 0) {
          return App.json(res, true, App.t('success', res.lang), mRestaurantOrders);
        }
      } catch(clientSearchError) {
        console.debug('Client search error:', clientSearchError);
      }

      // Try to find by MenuItem info
      try {
        mRestaurantOrders = await App.getModel('Restaurant').getAllOrdersWhere(
          {
            status: {
              [ App.DB.Op.or ]: statusAsOption
            },
            '$OrderSuppliers.OrderSupplierItems.MenuItem.name$': { [App.DB.Op.like]: `%${search}%` },
            '$OrderSuppliers.OrderSupplierItems.MenuItem.description$': { [App.DB.Op.like]: `%${search}%` },
            '$OrderSuppliers.OrderSupplierItems.MenuItem.id$': { [App.DB.Op.like]: `%${int}%` },
            '$OrderSuppliers.OrderSupplierItems.MenuItem.price$': { [App.DB.Op.like]: `%${float}%` }
          },
          {
            restaurantId: mRestaurant.id,
          }, 
          { offset, limit, order, orderBy }
        );

        if(mRestaurantOrders.count > 0) {
          return App.json(res, true, App.t('success', res.lang), mRestaurantOrders);
        }
      } catch(menuItemSearchError) {
        console.debug('MenuItem search error:', menuItemSearchError);
      }

      // Try to find by Order properties
      try {
        mRestaurantOrders = await App.getModel('Restaurant').getAllOrdersWhere(
          {
            status: {
              [ App.DB.Op.or ]: statusAsOption
            },
            [ App.DB.Op.or ]: {
              id: { [ App.DB.Op.like ]: `%${search}%` },
              discountCode: { [ App.DB.Op.like ]: `%${search}%` },
              clientDescription: { [ App.DB.Op.like ]: `%${search}%` },
            }
          },
          {
            restaurantId: mRestaurant.id,
          }, 
          { offset, limit, order, orderBy }
        );

        if(mRestaurantOrders.count > 0) {
          return App.json(res, true, App.t('success', res.lang), mRestaurantOrders);
        }
      } catch(orderSearchError) {
        console.debug('Order search error:', orderSearchError);
      }

      return App.json(res, 404, App.t(['not-found'], res.lang), {count: 0, rows: []});
    } catch(e) {
      console.log(e);
      App.onRouteError(req, res, e);
    }
  });
  return { router, method: 'POST', autoDoc:{} };
};
