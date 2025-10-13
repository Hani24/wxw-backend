const express = require('express');
const router = express.Router();

// /public/restaurant/access-recovery/verify/code/:code

module.exports = function(App, RPath){

  router.use('', App.multer.upload.form.any(), async(req, res)=>{

    try{

      // NOT IN USE

      const data = req.getPost();
      const code = req.getCommonDataString('code', false);

      return await App.renderUI( res, 'message', {
        header: App.t(['Access Forbidden'], req.lang),
        message: App.t(['Disabled'], req.lang, ''),
      });

      if( !code ){
        return await App.renderUI( res, 'message', {
          header: App.t(['access-recovery'], req.lang),
          message: App.t(['[code]','is-required'], req.lang, ''),
        });
      }

      const mAccessRecovery = await App.getModel('AccessRecovery').findOne({ 
        where: {
          code,
          isExpired: false,
          isUsed: false,
        }
      });

      if( !App.isObject(mAccessRecovery) || !App.isPosNumber(mAccessRecovery.id) ){
        return await App.renderUI( res, 'message', {
          header: App.t(['access-recovery'], req.lang),
          message: App.t(['verification','[code]','not','found'], req.lang, ''),
        });
      }

      await mAccessRecovery.update({isUsed: true, isExpired: true });

      const mUser = await App.getModel('User').getById( mAccessRecovery.userId );

      // TODO: => ....

      return await App.renderUI( res, 'message', {
        header: App.t(['Thank you!'], req.lang),
        message: App.t(['Your email address has been verified.','You can now log into your account'], req.lang, ''),
        icon: { name: 'success', size: 100 },
      });

    }catch(e){
      console.log(e);
      App.onRouteError( req, res, e );
      // App.json( res, false, App.t('request-could-not-be-processed', req.lang) );
    }

  });

  return { router, method: '', autoDoc:{} };

};


