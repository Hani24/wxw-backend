const express = require('express');
const router = express.Router();

// {
//   "id": "required: <number> Ref. MenuItem.id",
//   "amount": "required: <number>: send: (0) to delete item from Cart"
// }

// /private/client/cart/set/amount/by/menu-item/id/:id

module.exports = function(App, RPath){

  router.use('', async(req, res)=>{

    try{

      const mUser = await req.user;
      const mClient = await req.client;

      const data = req.getPost();
      const id = req.getCommonDataInt('id',null);
 
      if( App.isNull(id) )
        return App.json( res, 417, App.t(['Menu-Item','id','is-required'], req.lang) );

      let amount = req.getCommonDataInt('amount',null);
      if( App.isNull(amount) )
        return App.json( res, 417, App.t(['Cart-Item','amount','is-required'], req.lang) );

      amount = App.getNumber(amount, {floor:true, abs:true});
      amount = App.constrainNumber( amount, 0, 1000 );

      const mCart = await App.getModel('Cart').getByClientId(mClient.id);

      const mMenuItem = await App.getModel('MenuItem').findOne({
        where: {
          // isAvailable: true,
          id: id,          
        },
        attributes:['id','isAvailable','restaurantId']
      });

      if( !App.isObject(mMenuItem) || !App.isPosNumber(mMenuItem.id) )
        return App.json( res, 404, App.t(['Menu-Item','id','not-found'], req.lang) );

      if( !mMenuItem.isAvailable )
        return App.json( res, 417, App.t(['Menu-Item','has-been','sold','out'], req.lang) );

      let mCartItem = await App.getModel('CartItem').getByFields({
        cartId: mCart.id,
        menuItemId: mMenuItem.id,
      });

      if( !App.isObject(mCartItem) || !App.isPosNumber(mCartItem.id) ){

        if( amount === 0 )
          return await App.json( res, true, App.t('success', res.lang), {
            amount: amount,
            deleted: (amount === 0),
          });

        mCartItem = await App.getModel('CartItem').create({
          restaurantId: mMenuItem.restaurantId,
          cartId: mCart.id,
          menuItemId: mMenuItem.id,
        });

        if( !App.isObject(mCartItem) || !App.isPosNumber(mCartItem.id) )
          return App.json( res, false, App.t(['failed-to','set','amount'], req.lang) );

      }

      const updateRes = ( amount === 0 )
        ? await mCartItem.destroy()
        : await mCartItem.update({ amount });

      App.json( res, true, App.t('success', res.lang), {
        amount: amount,
        deleted: (amount === 0),
      });

    }catch(e){
      console.log(e);
      App.onRouteError( req, res, e );
      // App.json( res, false, App.t('request-could-not-be-processed', req.lang) );
    }

  });

  return { router, method: '', autoDoc:{} };

};


