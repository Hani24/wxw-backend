const express = require('express');
const router = express.Router();

// {
//   "id": "required: <number> Ref. Restaurant.id",
//   "menuCategories": "optional: [ array:<number> Ref. MenuCategory.id ]"
// }

// {
//   "id": 2,
//   "menuCategories": []
// }

// /public/restaurant/menu-categories/get/all/by/restaurant/id/:id

module.exports = function(App, RPath){

  router.use('', async(req, res)=>{

    try{

      const mUser = await req.user;
      const mClient = await req.client;
      const data = req.getPost();
      const id = req.getCommonDataInt('id',null);

      if( App.isNull(id) )
        return App.json( res, 417, App.t(['Restaurant','id','is-required'], req.lang) );

      const mRestaurant = await App.getModel('Restaurant').findOne({
        where: {
          id,
          isVerified: true,
          isRestricted: false,
          isOpeningHoursSet: true,
          isKycCompleted: true,
        },
        attributes: [
          'id','name','image','zip','street',
          'rating','type','lat','lon','isOpen',
          'shareableLink',
        ],
      });

      if( !App.isObject(mRestaurant) || !App.isPosNumber(mRestaurant.id) )
        return App.json( res, 404, App.t(['Restaurant','id','not-found'], req.lang) );

      // mRestaurant.dataValues.image = App.S3.getUrlByName(mRestaurant.image);

      const menuCategories = (App.isArray(data.menuCategories) ? data.menuCategories : [])
        .filter((id)=>App.isPosNumber(Math.floor(+id)))
        .map((id)=>Math.floor(+id));

      // console.json({ mMenuCategories, menuCategories });
      const includeMenuItem = [];
      if( App.isObject(mClient) && App.isPosNumber(mClient.id) ){

        includeMenuItem.push({
          model: App.getModel('FavoriteMenuItem'),
          attributes: ['id'],
          where: { clientId: mClient.id },
          required: false,
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

      }

      const menuCategoryWhere = {
        restaurantId: mRestaurant.id,
        isDeleted: false,
      };

      if( !!(menuCategories.length) ){
        menuCategoryWhere['id'] = { [ App.DB.Op.in ]: menuCategories }
      }

      const mMenuCategories = await App.getModel('MenuCategory').findAll({
        where: menuCategoryWhere,
        attributes: ['id','name','description','order'],
        order: [['order','asc']],
        include: [{
          model: App.getModel('MenuItem'),
          required: true, // show only MenuCategory where atleast one MenuItem isAvailable
          attributes: [
            'id','name','image','description','order','kcal','proteins',
            'fats','carbs','price','rating','createdAt',
          ],
          where: {
            isAvailable: true,
            isDeleted: false,
          },
          include: includeMenuItem,
        }]
      });

      // fix menu-items sorting
      mRestaurant.dataValues.MenuCategories = (App.isArray(mMenuCategories) ? mMenuCategories : [])
        .map((MenuCategory)=>{
          MenuCategory.MenuItems.dataValues = MenuCategory.MenuItems
            .sort((a, b)=>{
              return ((a.order>b.order)?1:-1)
            });
          return MenuCategory;
        });

      if( App.isArray(mRestaurant.dataValues.MenuCategories) && mRestaurant.dataValues.MenuCategories.length ){
        for( const mMenuCategory of mRestaurant.dataValues.MenuCategories ){
          if( App.isArray(mMenuCategory.MenuItems) && mMenuCategory.MenuItems.length ){
            for( const mMenuItem of mMenuCategory.MenuItems ){

              mMenuItem.dataValues.isFavorite = App.isObject(mMenuItem.FavoriteMenuItem);

              // if( App.isObject(mMenuItem.FavoriteMenuItem) ){
              //   mMenuItem.dataValues.isFavorite = (!!mMenuItem.FavoriteMenuItem.id);
              // }

              // if( App.isArray(mMenuItem.FavoriteMenuItems) ){
              //   mMenuItem.dataValues.isFavorite = (!!mMenuItem.FavoriteMenuItems.length);
              // }
              mMenuItem.dataValues.amountInCart = 0;
              if( App.isArray(mMenuItem.CartItems) && ( !! mMenuItem.CartItems.length) ){
                mMenuItem.dataValues.amountInCart = mMenuItem.CartItems[0].amount;
              }

              delete mMenuItem.dataValues.CartItems;
              delete mMenuItem.dataValues.FavoriteMenuItem;

            }
          }
        }
      }

      mRestaurant.dataValues.distance = 0;
      mRestaurant.dataValues.distanceType = '';

      if( App.isObject(mUser) && App.isPosNumber(mUser.id) ){

        const mDeliveryPriceSettings = await App.getModel('DeliveryPriceSettings').getSettings();
        if( App.isObject(mDeliveryPriceSettings) ){
          const distRes = App.geo.lib.getDistance( mUser, mRestaurant, mDeliveryPriceSettings.unitType );
          if( distRes.success ){
            mRestaurant.dataValues.distance = distRes.data.distance;
            mRestaurant.dataValues.distanceType = distRes.data.units;
            // mRestaurant.dataValues.distance = 1.25;
            // mRestaurant.dataValues.distanceType = 'km';                
          }
        }
      }

      // console.json({mRestaurant});
      App.json( res, true, App.t('success', res.lang), mRestaurant);

    }catch(e){
      console.log(e);
      App.onRouteError( req, res, e );
      // App.json( res, false, App.t('request-could-not-be-processed', req.lang) );
    }

  });

  return { router, method: '', autoDoc:{} };

};


