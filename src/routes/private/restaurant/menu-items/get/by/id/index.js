const express = require('express');
const router = express.Router();

// {
//   "id": "required: <number> Ref. MenuItem.id"
// }

// /private/restaurant/menu-items/get/by/id

module.exports = function(App, RPath){

  router.use('', async(req, res)=>{

    try{

      const mUser = await req.user;
      const mRestaurant = await req.restaurant;
      const id = req.getCommonDataInt('id', null);

      const mMenuItem = await App.getModel('MenuItem').findOne({
        where: {
          id: id,
          restaurantId: mRestaurant.id,
          isDeleted: false,
        },
        attributes: [
          'id','order',
          'image','name','description','price','rating','isAvailable',
          'kcal','proteins','fats','carbs',
          'createdAt'
        ],
      });

      App.json( res, true, App.t('success', res.lang), mMenuItem);

    }catch(e){
      console.log(e);
      App.onRouteError( req, res, e );
      // App.json( res, false, App.t('request-could-not-be-processed', req.lang) );
    }

  });

  return { router, method: '', autoDoc:{} };

};


