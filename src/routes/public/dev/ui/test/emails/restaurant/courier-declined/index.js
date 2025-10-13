const express = require('express');
const router = express.Router();

// /public/dev/ui/test/emails/restaurant/courier-declined/

module.exports = function(App, RPath){

  router.use('', async(req, res)=>{

    try{

      App.html(res, await App.Mailer.createEmailTemplate('courier-account-verification-declined', { 
        lang: 'en',
        firstName: 'Bob',
        lastName: 'Marley',
      }));

      // App.html(res, await App.Mailer.createEmailTemplate('restaurant-new-employee', { 
      //   lang: 'en',
      //   // password: await App.BCrypt.hash( await App.BCrypt.randomSecurePassword() ),
      //   password: await App.BCrypt.randomSecureToken(12),
      // }));

    }catch(e){
      console.log(e);
      App.onRouteError( req, res, e );
      // App.json( res, false, App.t('request-could-not-be-processed', req.lang) );
    }

  });

  return { router, method: '', autoDoc:{} };

};


