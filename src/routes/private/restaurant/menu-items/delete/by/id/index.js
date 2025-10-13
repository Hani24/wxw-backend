const express = require('express');
const router = express.Router();

// /private/restaurant/menu-items/delete/by/id/:id

module.exports = function(App, RPath){

  router.use('', async(req, res)=>{

    try{

      const mUser = await req.user;
      const mRestaurant = await req.restaurant;

      const data = req.getPost();
      const id = req.getCommonDataInt('id',null);
 
      if( App.isNull(id) )
        return App.json( res, 417, App.t(['Menu-Item','id','is-required'], req.lang) );

      const mMenuItem = await App.getModel('MenuItem').getByFields({
        id,
        restaurantId: mRestaurant.id,
        isDeleted: false,
      });

      if( !App.isObject(mMenuItem) || !App.isPosNumber(mMenuItem.id) )
        return App.json( res, 404, App.t(['Menu-Item','id','not-found'], req.lang) );

      const updateRes = await mMenuItem.update({
        isDeleted: true,
        deletedAt: App.getISODate(),
      });

      if( !App.isObject(updateRes) || !App.isPosNumber(updateRes.id) )
        return App.json( res, false, App.t(['failed-to','delete','Menu-Item'], req.lang) );

      await App.getModel('FavoriteMenuItem').destroy({
        where: {
          menuItemId: updateRes.id
        }
      });

      App.json( res, true, App.t('success', res.lang), updateRes );

    }catch(e){
      console.log(e);
      App.onRouteError( req, res, e );
      // App.json( res, false, App.t('request-could-not-be-processed', req.lang) );
    }

  });

  return { router, method: '', autoDoc:{} };

};


