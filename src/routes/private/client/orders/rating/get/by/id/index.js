const express = require('express');
const router = express.Router();

// {
//   "id": "required: <number> Ref. Order.id"
// }

// {
//   "id": 10000000004
// }

// /private/client/orders/rating/get/by/id/:id

module.exports = function(App, RPath){

  router.use('', async(req, res)=>{

    try{

      const mUser = await req.user;
      const mClient = await req.client;
      const data = req.getPost();
      const id = req.getCommonDataInt('id',null);

      if( App.isNull(id) )
        return App.json( res, 417, App.t(['Order','id','is-required'], req.lang) );

      const mOrder = await App.getModel('Order').findOne({
        where: {
          id, // 10000000004
          clientId: mClient.id, // 2
        },
        attributes: [
          'id','status','totalPrice','deliveryPrice','finalPrice',
          'isCourierRatedByClient', 'courierRatedByClientAt',
          'courierRating',
          'isOrderRatedByClient', 'orderRatedByClientAt',
        ],
        include: [{
          model: App.getModel('OrderSupplier'),
          attributes: ['id'],
          include: [{
            model: App.getModel('OrderSupplierItem'),
            attributes: [
              'id','amount','totalPrice','isRatedByClient','rating', // 'ratedAt',
            ],
            include: [{
              model: App.getModel('MenuItem'),
              attributes: ['id','name','image','price'],
              include: [{
                model: App.getModel('Restaurant'),
                attributes: ['id','name','image']
              }]
            }]
          }]
        }]
      });

      if( !App.isObject(mOrder) || !App.isPosNumber(mOrder.id) )
        return App.json( res, 404, App.t(['Order','id','not-found'], req.lang) );

      App.json( res, true, App.t('success', res.lang), mOrder);

    }catch(e){
      console.log(e);
      App.onRouteError( req, res, e );
      // App.json( res, false, App.t('request-could-not-be-processed', req.lang) );
    }

  });

  return { router, method: '', autoDoc:{} };

};


