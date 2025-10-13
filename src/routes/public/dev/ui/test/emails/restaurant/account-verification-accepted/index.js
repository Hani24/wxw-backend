const express = require('express');
const router = express.Router();

// /public/dev/ui/test/emails/restaurant/account-verification-accepted

module.exports = function(App, RPath){

  router.use('', async(req, res)=>{

    try{

      const mUser = await App.getModel('User').findOne({where:{id: 6}});

      const code = App.BCrypt.randomSecureToken(24);

      // const mAccessRecovery = await App.getModel('AccessRecovery').findOne({
      //   order: [['id','desc']]
      // });

      // App.t(['restaurant-account-verification-accepted'], req.lang);

      App.html(res, await App.Mailer.createEmailTemplate('restaurant-account-verification-accepted', { 
        lang: 'en',
        firstName: 'First-Name',
        lastName: 'Last-Name',
      }));

    }catch(e){
      console.log(e);
      App.onRouteError( req, res, e );
      // App.json( res, false, App.t('request-could-not-be-processed', req.lang) );
    }

  });

  return { router, method: '', autoDoc:{} };

};


