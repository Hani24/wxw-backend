const express = require('express');
const router = express.Router();

// /public/client/email-verification/verify/code/:code

module.exports = function(App, RPath){

  router.use('', App.modifiers.noBots, async(req, res)=>{

    try{

      await console.sleep(1500);

      const data = req.getPost();
      const code = req.getCommonDataString('code', false);
      const roles = App.getModel('User').getRoles();

      if( !code ){
        return await App.renderUI( res, 'message', {
          header: App.t(['email-verification'], req.lang),
          message: App.t(['[code]','is-required'], req.lang, ''),
          icon: { name: 'error', size: 100 },
        });
      }

      // [dev]
      // const mEmailVerification = await App.getModel('EmailVerification').findOne({ 
      //   where:{code},
      // });

      const mEmailVerification = await App.getModel('EmailVerification').getLatestByCode({ 
        code,
      });

      if( !App.isObject(mEmailVerification) || !App.isPosNumber(mEmailVerification.id) ){
        return await App.renderUI( res, 'message', {
          header: App.t(['email-verification'], req.lang),
          message: App.t(['verification','[code]','not','found','or','/','and','has-been','expired'], req.lang, ''),
          icon: { name: 'error', size: 100 },
        });
      }

      const mUser = await App.getModel('User').getById( mEmailVerification.userId );
      if( !App.isObject(mUser) || !App.isPosNumber(mUser.id) ){
        return await App.renderUI( res, 'message', {
          header: App.t(['email-verification'], req.lang),
          message: App.t(['user','not','found'], req.lang, ''),
          icon: { name: 'error', size: 100 },
        });        
      }

      if( mUser.isRestricted || mUser.isDeleted ){
        return await App.renderUI( res, 'message', {
          message: App.t(['verification','error'], req.lang, ''),
          message: App.t(['access','has-been','restricted'], req.lang),
          icon: { name: 'error', size: 100 },
        });        
      }

      if( !mUser.isEmailVerified ){
        const updateUser = await mUser.update({isEmailVerified: true});
        if( !App.isObject(updateUser) || !App.isPosNumber(updateUser.id) ){
          return await App.renderUI( res, 'message', {
            message: App.t(['verification','error'], req.lang, ''),
            message: App.t(['failed-to','update','user','account'], req.lang),
            icon: { name: 'error', size: 100 },
          });
        }

        const mClient = await App.getModel('Client').findOne({
          where: { 
            userId: mUser.id
          },
          attributes: ['id','isVerified','isRestricted','isDeleted']
        });

        // if( mClient.isRestricted || mClient.isDeleted ){}
        const updateClient = await mClient.update({
          isVerified: true,
          verifiedAt: App.getISODate(),
        });

        if( !App.isObject(updateClient) || !App.isPosNumber(updateClient.id) ){
          return await App.renderUI( res, 'message', {
            message: App.t(['verification','error'], req.lang, ''),
            message: App.t(['failed-to','update','client','account'], req.lang),
            icon: { name: 'error', size: 100 },
          });
        }

      }

      await mEmailVerification.update({isUsed: true, isExpired: true });

      await App.renderUI( res, 'message', {
        header: App.t(['Thank you!'], req.lang),
        message: App.t(['Your email address has been verified.','You can now log into your account'], req.lang, ''),
        icon: { name: 'success', size: 100 },
      });

      // const welcomeEmailRes = await App.Mailer.send({
      //   to: updateUser.email,
      //   subject: App.t('welcome-new-user', updateUser.lang),
      //   data: await App.Mailer.createEmailTemplate('welcome-new-user', { 
      //     lang: updateUser.lang,
      //     updateUser: mUser,
      //   })
      // });
      // if( welcomeEmailRes.success ){}

    }catch(e){
      console.log(e);
      App.onRouteError( req, res, e );
      // App.json( res, false, App.t('request-could-not-be-processed', req.lang) );
    }

  });

  return { router, method: '', autoDoc:{} };

};


