const express = require('express');
const router = express.Router();

/*
{
  "id": "required: <number> Reg. MenuItem.id"
}
*/

// /private/client/favorite/menu-items/add/by/menu-item/id

module.exports = function(App, RPath){

  router.use('', async(req, res)=>{

    try{

      const mUser = await req.user;
      const mClient = await req.client;

      const data = req.getPost();
      const id = req.getCommonDataInt('id',null);
 
      if( App.isNull(id) )
        return App.json( res, 417, App.t(['Menu-Item','id','is-required'], req.lang) );

      const mMenuItem = await App.getModel('MenuItem').getByFields({
        id,
      });

      if( !App.isObject(mMenuItem) || !App.isPosNumber(mMenuItem.id) )
        return App.json( res, 404, App.t(['Menu-Item','id','not-found'], req.lang) );

      if( (await App.getModel('FavoriteMenuItem').isset({ clientId: mClient.id, menuItemId: mMenuItem.id })) )
        return App.json( res, true, App.t(['Menu-Item','already','added'], req.lang) );

      const mFavoriteMenuItem = await App.getModel('FavoriteMenuItem').create({
        clientId: mClient.id, 
        menuItemId: mMenuItem.id
      });

      if( !App.isObject(mFavoriteMenuItem) || !App.isPosNumber(mFavoriteMenuItem.id) )
        return App.json( res, false, App.t(['failed-to','create','Favorite','Menu-Item'], req.lang) );

      App.json( res, true, App.t('success', res.lang), mFavoriteMenuItem );

    }catch(e){
      console.log(e);
      App.onRouteError( req, res, e );
      // App.json( res, false, App.t('request-could-not-be-processed', req.lang) );
    }

  });

  return { router, method: '', autoDoc:{} };

};


