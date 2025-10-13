const express = require('express');
const router = express.Router();

// {
//   "menuItemId": "required: <number> Ref. MenuItem.id",
//   "toMenuCategoryId": "required: <number> Ref. MenuCategory.id"
// }

// MenuCategory.id == 7, drienks
// MenuCategory.id == 8, burgers
// MenuItem.id == 7, fanta

// {
//   "menuItemId": 7,
//   "toMenuCategoryId": 8
// }

// /private/restaurant/menu-items/move/by/id/

module.exports = function(App, RPath){

  router.use('', App.multer.upload.tmp.any(), async(req, res)=>{

    try{

      const mUser = await req.user;
      const mRestaurant = await req.restaurant;

      const data = req.getPost();
      const menuItemId = req.getCommonDataInt('menuItemId', null);
      const toMenuCategoryId = req.getCommonDataInt('toMenuCategoryId', null);
 
      if( !App.isPosNumber(menuItemId) )
        return App.json( res, 417, App.t(['menu','item','id','is-required'], req.lang) );

      if( !App.isPosNumber(toMenuCategoryId) )
        return App.json( res, 417, App.t(['menu','category','id','is-required'], req.lang) );

      const mMenuItem = await App.getModel('MenuItem').getByFields({
        id: menuItemId,
        restaurantId: mRestaurant.id,
      });

      if( !App.isObject(mMenuItem) || !App.isPosNumber(mMenuItem.id) )
        return App.json( res, 404, App.t(['menu','item','id','not-found'], req.lang) );

      if( mMenuItem.menuCategoryId === toMenuCategoryId )
        return App.json( res, true, App.t(['menu','item','already','moved'], res.lang) );

      const mMenuCategory = await App.getModel('MenuCategory').getByFields({
        id: toMenuCategoryId,
        restaurantId: mRestaurant.id,
      });

      if( !App.isObject(mMenuCategory) || !App.isPosNumber(mMenuCategory.id) )
        return App.json( res, 404, App.t(['menu','category','id','not-found'], req.lang) );

      const updateRes = await mMenuItem.update({
        menuCategoryId: toMenuCategoryId,
      });

      if( !App.isObject(updateRes) || !App.isPosNumber(updateRes.id) )
        return App.json( res, false, App.t(['failed-to','update','menu','item'], req.lang) );

      App.json( res, true, App.t(['menu','item','successfully','moved-to', mMenuCategory.name], res.lang) );

    }catch(e){
      console.log(e);
      App.onRouteError( req, res, e );
      // App.json( res, false, App.t('request-could-not-be-processed', req.lang) );
    }

  });

  return { router, method: '', autoDoc:{} };

};


