const express = require('express');
const router = express.Router();

// /public/dev/ui/test/emails/restaurant/new-order/

module.exports = function(App, RPath){

  router.use('', async(req, res)=>{

    try{

      const mOrder = await App.getModel('Order').findOne({
        where: {id: App.isEnv('dev') ? 10000000309 : 10000002309 },
        attributes: [
          'id',
          // 'deliveryPrice','totalPrice','totalItems','finalPrice',
          'isPaid','isRefunded','createdAt'
        ],
        include: [{
          model: App.getModel('OrderSupplier'),
          where: {
            restaurantId: 2
          },
          attributes: ['id','totalPrice','totalItems','restaurantId'],
          include: [{
            model: App.getModel('OrderSupplierItem'),
            attributes: ['id','price','amount','totalPrice'],
            include: [{
              model: App.getModel('MenuItem'),
              attributes: ['id','name','image'],
            }]
          }]
        }]
      });

      App.html(res, await App.Mailer.createEmailTemplate('restaurant-new-order', { 
        lang: 'en',
        mOrder: mOrder,
        mOrderSupplier: mOrder.OrderSuppliers[0],
      }));

      // const newOrderRes = await App.Mailer.send({
      //   to: 'ch3ll0v3k@yandex.com',
      //   subject: App.t(['new','order','received',`#${mOrder.id}`], req.lang),
      //   data: await App.Mailer.createEmailTemplate('restaurant-new-order', { 
      //     lang: 'en',
      //     mOrder: mOrder,
      //     mOrderSupplier: mOrder.OrderSuppliers[0],
      //   })
      // });

      // console.json({newOrderRes});

    }catch(e){
      console.log(e);
      App.onRouteError( req, res, e );
      // App.json( res, false, App.t('request-could-not-be-processed', req.lang) );
    }

  });

  return { router, method: '', autoDoc:{} };

};


