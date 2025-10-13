const express = require('express');
const router = express.Router();

// /public/user/email-verification/verify/code/:code

module.exports = function(App, RPath){

  router.use('', App.modifiers.noBots, async(req, res)=>{

    try{

      await console.sleep(1500);

      // https://api.3dmadcat.ru/public/user/email-verification/verify/code/d0f8e9bc4ab614f9ccc1035b

      const data = req.getPost();
      const code = req.getCommonDataString('code', false);

      const action = {
        name: 'Go to the Restaurant Dashboard',
        link: App.getEnv('UI_RESTAURANT_PROTODOMAIN'),
      };

      if( !code ){
        return await App.renderUI( res, 'message', {
          header: App.t(['email-verification'], req.lang),
          message: App.t(['[code]','is-required'], req.lang, ''),
          icon: { name: 'error', size: 100 },
        });
      }

      const mEmailVerification = await App.getModel('EmailVerification').getLatestByCode({ 
        code,
      });

      if( !App.isObject(mEmailVerification) || !App.isPosNumber(mEmailVerification.id) ){
        return await App.renderUI( res, 'message', {
          header: App.t(['email-verification'], req.lang),
          message: App.t(['verification','[code]','not','found','or','/','and','has-been','expired'], req.lang, ''),
          icon: { name: 'error', size: 100 },
          // action,
        });
      }

      const mUser = await App.getModel('User').getById( mEmailVerification.userId );

      if( !App.isObject(mUser) || !App.isPosNumber(mUser.id) ){
        return await App.renderUI( res, 'message', {
          header: App.t(['email-verification'], req.lang),
          message: App.t(['user','[id]','not','found'], req.lang, ''),
          icon: { name: 'error', size: 100 },
          // action,
        });        
      }

      await mEmailVerification.update({isUsed: true, isExpired: true });
      await mUser.update({isEmailVerified: true});

      /* return await */ App.renderUI( res, 'message', {
        header: App.t(['Thank you!'], req.lang),
        message: App.t(['Your email address has been verified.'], req.lang, ''),
        icon: { name: 'success', size: 100 },
          action,
      });

      // const welcomeEmailRes = await App.Mailer.send({
      //   to: mUser.email,
      //   subject: App.t('welcome-new-user', mUser.lang),
      //   data: await App.Mailer.createEmailTemplate('welcome-new-user', { 
      //     lang: mUser.lang,
      //     mUser: mUser,
      //   })
      // });

      // // console.json({ welcomeEmailRes });
      // if( welcomeEmailRes.success ){
      //   // ...
      // }

    }catch(e){
      console.log(e);
      App.onRouteError( req, res, e );
      // App.json( res, false, App.t('request-could-not-be-processed', req.lang) );
    }

  });

  return { router, method: '', autoDoc:{} };

};


