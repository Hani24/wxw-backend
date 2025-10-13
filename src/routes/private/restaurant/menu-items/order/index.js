const express = require('express');
const router = express.Router();

/*
{
  "id": "required: <number> Ref. MenuCategory.id",
  "order": [
    { 
      "id": "required: <number> Ref. MenuItem.id", 
      "index": "required: <number> order of Menu-Item in Menu-Category"
    }
  ]
}

{
  "id": 3,
  "order": [
    { "id": 3, "index": 0 },
    { "id": 6, "index": 1 }
  ]
}

*/

// /private/restaurant/menu-items/order/

module.exports = function(App, RPath){

  router.use('', async(req, res)=>{

    try{

      const data = req.getPost();
      const mUser = await req.user;
      const mRestaurant = await req.restaurant;

      const id = req.getCommonDataInt('id',null);
      // console.json({data});
 
      if( !App.isPosNumber(id) )
        return App.json( res, 417, App.t(['menu','category','id','is-required'], req.lang) );

      const isset = await App.getModel('MenuCategory').isset({
        id,
        restaurantId: mRestaurant.id,
      });

      if( !isset )
        return App.json( res, 404, App.t(['menu','category','not-found'], req.lang) );

      const order = (App.isArray(data.order) ? data.order : [])
        .filter((mItem)=>{
          return ( App.isPosNumber(Math.floor(+mItem.id)) && App.isPosNumber(Math.floor(+mItem.index)) )
        })
        .map((mItem)=>{
          return {
            id: Math.floor(+mItem.id),
            index: Math.floor(+mItem.index),
          }
        });

      // console.json({order, data});

      if( !order.length )
        return App.json( res, 417, App.t(['order','is-empty'], req.lang) );

      for( const mItem of order ){

        const mMenuItem = await App.getModel('MenuItem').findOne({
          where: {
           restaurantId: mRestaurant.id,
           id: mItem.id, 
          }
        });

        if( App.isObject(mMenuItem) && App.isPosNumber(mMenuItem.id) ){
          await mMenuItem.update({order: mItem.index });
        }

      }

      App.json( res, true, App.t(['success'], res.lang) );

    }catch(e){
      console.log(e);
      App.onRouteError( req, res, e );
      // App.json( res, false, App.t('request-could-not-be-processed', req.lang) );
    }

  });

  return { router, method: '', autoDoc:{} };

};


