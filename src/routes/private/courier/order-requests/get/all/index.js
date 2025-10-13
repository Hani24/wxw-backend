const express = require('express');
const router = express.Router();

// /private/courier/order-requests/get/all/

module.exports = function(App, RPath){

  router.use('', async(req, res)=>{

    try{

      return App.json( res, 417, App.t(['disabled'], res.lang) );

      const data = req.getPost();
      const mUser = await req.user;
      const mCourier = await req.courier;

      const mCourierOrderRequests = await App.getModel('CourierOrderRequest').findAll({
        where: {
          courierId: mCourier.id,
          isAccepted: false,
          isRejected: false,
        },
        attributes:[
          'id','orderId',
        ],
        include: [{
          model: App.getModel('Order'),
          required: true,
          attributes: [
            'id','clientId','totalItems','status','clientDescription','createdAt'
          ],
          include: [{
            model: App.getModel('Client'),
            attributes: ['id'],
            include: [{
              model: App.getModel('User'),
              attributes: ['id','firstName','lastName'],
            }],
          }],
        }],
        order:[['id','asc']],
        limit: 5,
      });

      App.json( res, true, App.t(['success'], res.lang), mCourierOrderRequests );

    }catch(e){
      console.log(e);
      App.onRouteError( req, res, e );
      // App.json( res, false, App.t('request-could-not-be-processed', req.lang) );
    }

  });

  return { router, method: '', autoDoc:{} };

};


