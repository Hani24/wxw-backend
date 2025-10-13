const express = require('express');
const router = express.Router();

// /private/client/notification/get/all?offset=0&limit=15&order=desc

module.exports = function(App, RPath){

  router.use('', async(req, res)=>{

    try{

      const mUser = await req.user;
      const mClient = await req.client;
      const data = req.getPost();

      // const {offset, limit, order, by} = req.getPagination({});
      // const orderBy = App.getModel('ClientNotification').getOrderBy(by);
      const pagination = req.getPagination({});

      const mNotifications = await App.getModel('ClientNotification')
        .getAllByClientId( mClient.id, pagination );

      App.json( res, true, App.t('success', res.lang), mNotifications);

      // const pushRes = await App.getModel('ClientNotification')
      //   .pushToClient( mClient, {
      //     title: 'This is title', 
      //     message: 'This is message',
      //     image: false,
      //     data: {
      //       a: 123,
      //       arr: [0,1,2]
      //     }
      //   });

      // console.json({ pushRes })

    }catch(e){
      console.log(e);
      App.onRouteError( req, res, e );
      // App.json( res, false, App.t('request-could-not-be-processed', req.lang) );
    }

  });

  return { router, method: '', autoDoc:{} };

};


