const express = require('express');
const router = express.Router();

module.exports = function(App, RPath){

  router.use('', async(req, res)=>{

    try{

      // NOTE: currently not in use

      const code = App.BCrypt.randomSecureToken(24);
      App.html(res, await App.Mailer.createEmailTemplate('email-verification', { 
        lang: 'en',
        code: code,
        // path: App.toAppPath( 'web', 'user.email-verification-verify', code, false),
        // path: App.toAppPath( 'web', 'restaurant.email-verification-verify', code, false),
        // path: App.toAppPath( 'web', 'admin.email-verification-verify', code, false),
      }));

    }catch(e){
      console.log(e);
      App.onRouteError( req, res, e );
      // App.json( res, false, App.t('request-could-not-be-processed', req.lang) );
    }

  });

  return { router, method: '', autoDoc:{} };

};


