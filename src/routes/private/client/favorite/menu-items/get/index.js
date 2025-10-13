const express = require('express');
const router = express.Router();

// /private/client/favorite/menu-items/get/

// NOTE: re-test this route 

module.exports = function(App, RPath){

  router.use('', async(req, res)=>{

    try{

      const mUser = await req.user;
      const mClient = await req.client;

      const data = req.getPost();

      const includeMenuItem = [];

      includeMenuItem.push({
        model: App.getModel('FavoriteMenuItem'),
        attributes: [/* 'id' */],
        where: { clientId: mClient.id },
        required: true,
      });

      const mCart = await App.getModel('Cart').getByClientId(mClient.id);

      if( App.isObject(mCart) && App.isPosNumber(mCart.id) ){
        includeMenuItem.push({
          model: App.getModel('CartItem'),
          attributes: ['id','amount'],
          where: { 
            // menuItemId: <will be set in auto-mode>
            cartId: mCart.id,
          },
          required: false,
        });
      }

      const mRestaurants = await App.getModel('Restaurant').findAndCountAll({
        // where: restaurantWhere,
        distinct: true,
        attributes: [
          'id','name','image','cityId','zip','street',
          'rating','type','lat','lon','isOpen',
        ],
        include: [
          {
            model: App.getModel('City'),
            attributes: ['id','name'],
          },
          {
            model: App.getModel('MenuCategory'),
            attributes: ['id','name'],
            required: true,
            include: [
              {
                model: App.getModel('MenuItem'),
                attributes: [
                  'id','name','image','description','order','kcal','proteins',
                  'fats','carbs','price','rating','order','createdAt',
                ],
                required: true,
                where: {
                  isAvailable: true
                },
                include: includeMenuItem
              },
            ]
          }
        ],
        order: [[ 'id', 'desc' ]],
        // offset: offset,
        // limit: limit,
      });

      if( App.isArray(mRestaurants.rows) && mRestaurants.rows.length ){
        for( const mRestaurant of mRestaurants.rows ){
          if( App.isObject(mRestaurant) ){
            if( App.isArray(mRestaurant.MenuCategories) ){
              for( const mMenuCategory of mRestaurant.MenuCategories ){
                if( App.isArray(mMenuCategory.MenuItems) ){
                  for( const mMenuItem of mMenuCategory.MenuItems ){
                    if( App.isObject(mMenuItem) ){
                      mMenuItem.dataValues.isFavorite = true;

                      mMenuItem.dataValues.amountInCart = 0;
                      if( App.isArray(mMenuItem.CartItems) && ( !! mMenuItem.CartItems.length) ){
                        mMenuItem.dataValues.amountInCart = mMenuItem.CartItems[0].amount;
                      }

                      delete mMenuItem.dataValues.CartItems;
                      // delete mMenuItem.dataValues.FavoriteMenuItem;

                    }
                  }
                }
              }
            }
          }
        }
      }

      App.json( res, true, App.t('success', res.lang), mRestaurants);

    }catch(e){
      console.log(e);
      App.onRouteError( req, res, e );
      // App.json( res, false, App.t('request-could-not-be-processed', req.lang) );
    }

  });

  return { router, method: '', autoDoc:{} };

};


