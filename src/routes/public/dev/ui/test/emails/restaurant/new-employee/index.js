const express = require('express');
const router = express.Router();

// /public/dev/ui/test/emails/restaurant/new-employee/

module.exports = function(App, RPath){

  router.use('', async(req, res)=>{

    try{

      App.html(res, await App.Mailer.createEmailTemplate('restaurant-new-employee', { 
        lang: 'en',
        // password: await App.BCrypt.hash( await App.BCrypt.randomSecurePassword() ),
        password: await App.BCrypt.randomSecureToken(12),
      }));

      // const newOrderRes = await App.Mailer.send({
      //   to: 'ch3ll0v3k@yandex.com',
      //   subject: App.t(['new','order','received',`#${mOrder.id}`], req.lang),
      //   data: await App.Mailer.createEmailTemplate('restaurant-new-order', { 
      //     lang: 'en',
      //     mOrder: mOrder,
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


