const express = require('express');
const router = express.Router();

/*

{
  "id": "required: <number> Ref.CartItem.id"
}
*/

// /private/client/cart/delete/cart-item/by/id

module.exports = function(App, RPath){

  router.use('', async(req, res)=>{

    try{

      const mUser = await req.user;
      const mClient = await req.client;

      const data = req.getPost();
      const id = req.getCommonDataInt('id',null);
 
      if( App.isNull(id) )
        return App.json( res, 417, App.t(['Cart-Item','id','is-required'], req.lang) );

      const mCart = await App.getModel('Cart').getByClientId(mClient.id);

      const mCartItem = await App.getModel('CartItem').getByFields({
        id,
        cartId: mCart.id,
      });

      if( !App.isObject(mCartItem) || !App.isPosNumber(mCartItem.id) )
        return App.json( res, 404, App.t(['Cart-Item','not','found'], req.lang) );

      const destroyRes = await mCartItem.destroy();
      if( !App.isObject(destroyRes) || !App.isPosNumber(destroyRes.id) )
        return App.json( res, false, App.t(['failed-to','delete','Cart-Item'], req.lang) );

      App.json( res, true, App.t('success', res.lang), destroyRes);

    }catch(e){
      console.log(e);
      App.onRouteError( req, res, e );
      // App.json( res, false, App.t('request-could-not-be-processed', req.lang) );
    }

  });

  return { router, method: '', autoDoc:{} };

};


