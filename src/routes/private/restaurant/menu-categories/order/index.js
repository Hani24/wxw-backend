const express = require('express');
const router = express.Router();

/*
{
  "order": [
    { 
      "id": "required: <number> Ref. MenuCategory.id", 
      "index": "required: <number> order of MenuCategory item"
    }
  ]
}

{
  "order": [
    { "id": 3, "index": 0 },
    { "id": 6, "index": 1 }
  ]
}

*/

// /restaurant/menu-categories/order/

module.exports = function(App, RPath){

  router.use('', async(req, res)=>{

    try{

      const data = req.getPost();
      const mUser = await req.user;
      const mRestaurant = await req.restaurant;

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

        const mMenuCategory = await App.getModel('MenuCategory').findOne({
          where: {
           restaurantId: mRestaurant.id,
           id: mItem.id, 
          }
        });

        if( App.isObject(mMenuCategory) && App.isPosNumber(mMenuCategory.id) ){
          await mMenuCategory.update({order: mItem.index });
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


