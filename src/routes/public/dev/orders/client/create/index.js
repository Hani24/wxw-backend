const express = require('express');
const router = express.Router();

module.exports = function(App, RPath){

  router.use('', async(req, res)=>{

    try{


      const devAuthTokens = App.dev.api.getDevAuthTokens();
      App.dev.api.setAuthToken(devAuthTokens.client.token);

      // const addItemRes = await App.dev.api.post('/private/client/cart/set/amount/by/menu-item/id',{
      //   id: 44, // fanta
      //   amount: 1
      // });

      const addItemRes = await App.dev.api.post('/private/client/cart/set/amount/by/menu-item/id',{
        id: 46, // burger
        amount: 10, // 2.54 * 10.00 == 24.50
      });

      if( !addItemRes.success ){
        console.error(`#cart: ${addItemRes.message}`);
        return await App.json(res, addItemRes );
      }

      const cartRes = await App.dev.api.post('/private/client/cart/get');
      if( !cartRes.success ){
        console.error(`#cart: ${cartRes.message}`);
        return await App.json(res, cartRes );
      }

      const orderCreateRes = await App.dev.api.post('/private/client/orders/create');
      if( !orderCreateRes.success ){
        console.error(`#order-create: ${orderCreateRes.message}`);
        return await App.json(res, orderCreateRes );
      }

      const deliveryAddressesRes = await App.dev.api.post('/private/client/delivery-addresses/get/as/list');
      if( !deliveryAddressesRes.success ){
        console.error(`#delivery-address: ${deliveryAddressesRes.message}`);
        return await App.json(res, deliveryAddressesRes );
      }

      const setOrderDeliveryAddress = await App.dev.api.post('/private/client/orders/set/delivery-address', {
        id: orderCreateRes.data.id,
        deliveryAddressId: deliveryAddressesRes.data.pop().id,
      });
      if( !setOrderDeliveryAddress.success ){
        console.error(`#set-order-delivery-address: ${setOrderDeliveryAddress.message}`);
        return await App.json(res, setOrderDeliveryAddress );
      }

      const setOrderDeliveryTime = await App.dev.api.post('/private/client/orders/set/delivery-time', {
        id: orderCreateRes.data.id,
        deliveryDay: 'today',
        deliveryHour: 'now',
      });
      if( !setOrderDeliveryTime.success ){
        console.error(`#set-order-delivery-address: ${setOrderDeliveryTime.message}`);
        return await App.json(res, setOrderDeliveryTime );
      }

      const orderConfirmRes = await App.dev.api.post('/private/client/orders/confirm', {
        id: orderCreateRes.data.id,
      });
      if( !orderConfirmRes.success )
        console.error(`#order-create: ${orderConfirmRes.message}`);


      // const orderCancelRes = await App.dev.api.post('/private/client/orders/cancel/by/id/', {
      //   id: orderCreateRes.data.id,
      // });
      // if( !orderCancelRes.success ){
      //   console.error(`#order-create: ${orderCancelRes.message}`);
      // }
      // return await App.json(res, orderCancelRes );        

      await App.json(res, orderConfirmRes );

    }catch(e){
      console.log(e);
      App.onRouteError( req, res, e );
      // App.json( res, false, App.t('request-could-not-be-processed', req.lang) );
    }

  });

  return { router, method: '', autoDoc:{} };

};
