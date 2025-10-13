const express = require('express');
const router = express.Router();

/*
{
  "id": "required: <number> Ref. Restaurant.id"
}
*/

// /public/restaurant/working-time/get/by/id/:id

module.exports = function(App, RPath){

  router.use('', async(req, res)=>{

    try{

      const mUser = await req.user;

      const data = req.getPost();
      const id = req.getCommonDataInt('id',null);
 
      if( App.isNull(id) )
        return App.json( res, 417, App.t(['Restaurant','id','is-required'], req.lang) );

      const mRestaurant = await App.getModel('Restaurant').getById( id );

      if( !App.isObject(mRestaurant) || !App.isPosNumber(mRestaurant.id) )
        return App.json( res, 404, App.t(['Restaurant','id','not-found'], req.lang) );

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


