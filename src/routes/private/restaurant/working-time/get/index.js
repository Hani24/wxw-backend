const express = require('express');
const router = express.Router();

// /private/restaurant/working-time/get/

module.exports = function(App, RPath){

  router.use('', async(req, res)=>{

    try{


      const mUser = await req.user;
      const mRestaurant = await req.restaurant;
      const data = req.getPost();

      const mWorkingTime = await App.getModel('RestaurantWorkingTime')
        .getAsObjectByRestaurantId( mRestaurant.id ); 

      App.json( res, true, App.t(['success'], res.lang), mWorkingTime);

    }catch(e){
      console.log(e);
      App.onRouteError( req, res, e );
      // App.json( res, false, App.t('request-could-not-be-processed', req.lang) );
    }

  });

  return { router, method: '', autoDoc:{} };

};


