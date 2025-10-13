const express = require('express');
const router = express.Router();

// /public/restaurant/access-recovery/request/

module.exports = function(App, RPath){

  router.use('', App.modifiers.noBots, async(req, res)=>{

    try{

      await console.sleep(1500);

      const data = req.getPost();
      const email = req.getCommonDataString('email', false);
      const roles = App.getModel('User').getRoles({});

      if( !App.tools.isValidEmail(email) )
        return App.json(res, 417, App.t(['email-address','is','not','valid'], req.lang));

      const mUser = await App.getModel('User').findOne({where: {email, role: roles.restaurant}});
      if( !App.isObject(mUser) || !App.isPosNumber(mUser.id) ){
        await console.sleep(2000);
        return App.json( res, true, App.t([
          'if there is a user with requested email address, we will send verification email'
        ], req.lang), {f: false} );
      }

      if( !mUser.isEmailVerified )
        return App.json( res, 417, App.t(['email-verification','is-required'], mUser.lang) );

      if( mUser.role !== roles.restaurant ){
        return App.json( res, 417, App.t(['account','not','found','and','/','or','wrong','email','/','password'], req.lang));
        // return App.json( res, 401, App.t(['account','type','is-not','valid'], req.lang));        
      }


      let mAccessRecovery = await App.getModel('AccessRecovery').findOne({
        where: {
          userId: mUser.id,
          isUsed: false,
          isExpired: false,
        },
        order: [['id','asc']],
      });

      if( App.isObject(mAccessRecovery) && App.isNumber(mAccessRecovery.id) ){

        if( App.getModel('AccessRecovery').slowDownRequest( mAccessRecovery ) ){
          return App.json( res, 400, App.t([
            'email-send-1-minute-ago','wait-a-moment','repeat-this-step-if-necessary'
          ], req.lang ));
        }

        const mailResentRes = await App.Mailer.send({
          to: email,
          subject: App.t('access-recovery', mUser.lang),
          data: await App.Mailer.createEmailTemplate('restaurant-access-recovery', { 
            lang: mUser.lang,
            code: mAccessRecovery.code,
            path: App.toAppPath( 'web', 'restaurant.access-recovery-verify', mAccessRecovery.code, false),
          })
        });

        if( !mailResentRes.success ){
          console.error(mailResentRes.message);
          return App.json( res, false, App.t( mailResentRes.message, mUser.lang) );
        }

        await mAccessRecovery.update({ resendAt: App.getISODate() });

      }else{

        // "truncate" all previous requests
        await App.getModel('AccessRecovery').update(
          { isExpired: true },
          { where: { userId: mUser.id } },
        );

        mAccessRecovery = await App.getModel('AccessRecovery').create({
          userId: mUser.id,
          isUsed: false,
          isExpired: false,
          code: App.BCrypt.randomSecureToken(24),
          resendAt: App.getISODate(),
        });

        if( !App.isObject(mAccessRecovery) || !App.isNumber(mAccessRecovery.id) )
          return App.json( res, false, App.t(['failed-to','restore','account','access'], mUser.lang) );

        const mailSentRes = await App.Mailer.send({
          to: email,
          subject: App.t('access-recovery', mUser.lang),
          data: await App.Mailer.createEmailTemplate('restaurant-access-recovery', { 
            lang: mUser.lang,
            code: mAccessRecovery.code,
            path: App.toAppPath( 'web', 'restaurant.access-recovery-verify', mAccessRecovery.code, false),
          })
        });

        if( !mailSentRes.success ){
          console.error({mailSentRes});
          return App.json( res, false, App.t( mailSentRes.message, mUser.lang) );
        }

      }

      App.json( res, true, App.t([
        'if there is a user with requested email address, we will send verification email'
      ], req.lang), {f: true} );

    }catch(e){
      console.log(e);
      App.onRouteError( req, res, e );
      // App.json( res, false, App.t('request-could-not-be-processed', req.lang) );
    }

  });

  return { router, method: 'POST', autoDoc:{} };

};


