const express = require('express');
const router = express.Router();

// {
//   "id": "required: <number> Ref. MenuCategory.id"
// }

// {
//   "id": 2
// }

// /private/restaurant/menu-categories/get/by/id/:id

module.exports = function(App, RPath){

  router.use('', async(req, res)=>{

    try{

      const mUser = await req.user;
      const mRestaurant = await req.restaurant;

      const id = req.getCommonDataInt('id', 0);

      const mMenuCategorie = await App.getModel('MenuCategory').findOne({
        where: {
          id,
          restaurantId: mRestaurant.id,
          isDeleted: false,
        },
        attributes: ['id','name','description','order','createdAt'],
      });

      if( !App.isObject(mMenuCategorie) || !App.isPosNumber(mMenuCategorie.id) )
        return App.json( res, 404, App.t(['menu','category','not-found'], req.lang) );

      App.json( res, true, App.t('success', res.lang), mMenuCategorie);

    }catch(e){
      console.log(e);
      App.onRouteError( req, res, e );
      // App.json( res, false, App.t('request-could-not-be-processed', req.lang) );
    }

  });

  return { router, method: '', autoDoc:{} };

};


