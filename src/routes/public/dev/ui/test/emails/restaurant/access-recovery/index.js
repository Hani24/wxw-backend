const express = require('express');
const router = express.Router();

// /public/dev/ui/test/emails/restaurant/access-recovery/

module.exports = function(App, RPath){

  router.use('', async(req, res)=>{

    try{

      const mUser = await App.getModel('User').findOne({where:{id: 6}});

      const code = App.BCrypt.randomSecureToken(24);

      // const mAccessRecovery = await App.getModel('AccessRecovery').findOne({
      //   order: [['id','desc']]
      // });

      App.html(res, await App.Mailer.createEmailTemplate('restaurant-access-recovery', { 
        lang: 'en',
        code: /*mAccessRecovery.*/code,
        path: App.toAppPath( 'web', 'restaurant.access-recovery-verify', /*mAccessRecovery.*/code, false),
      }));

    }catch(e){
      console.log(e);
      App.onRouteError( req, res, e );
      // App.json( res, false, App.t('request-could-not-be-processed', req.lang) );
    }

  });

  return { router, method: '', autoDoc:{} };

};


