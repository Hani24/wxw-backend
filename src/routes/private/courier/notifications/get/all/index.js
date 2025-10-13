const express = require('express');
const router = express.Router();

// /private/courier/notification/get/all?offset=0&limit=15&order=desc

module.exports = function(App, RPath){

  router.use('', async(req, res)=>{

    try{

      const mUser = await req.user;
      const mCourier = await req.courier;
      const data = req.getPost();

      // const {offset, limit, order, by} = req.getPagination({});
      // const orderBy = App.getModel('CourierNotification').getOrderBy(by);
      const pagination = req.getPagination({});

      const mNotifications = await App.getModel('CourierNotification')
        .getAllByCourierId( mCourier.id, pagination );

      App.json( res, true, App.t('success', res.lang), mNotifications);

    }catch(e){
      console.log(e);
      App.onRouteError( req, res, e );
      // App.json( res, false, App.t('request-could-not-be-processed', req.lang) );
    }

  });

  return { router, method: '', autoDoc:{} };

};


