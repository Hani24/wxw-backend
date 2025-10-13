const express = require('express');
const router = express.Router();

// {
//   "code": "required: <string>",
//   "password": "required: <string>",
//   "passwordRepeat": "required: <string>"
// }

// /public/admin/access-recovery/verify/code/<code> [on:backend]
// code: 1466a9bc971d55f756043b596a376fde65152e0b7ca1f4b1

// /change-password/code/<code> [on:ui]

module.exports = function(App, RPath){

  router.use('', App.modifiers.noBots, async(req, res)=>{

    try{

      await console.sleep(1500);

      const data = req.getPost();
      const code = req.getCommonDataString('code', false);

      if( !code )
        return App.json(res, 417, App.t(['access-recovery','code','is-required'], req.lang));

      const mAccessRecovery = await App.getModel('AccessRecovery').findOne({ 
        where: {
          code,
          isExpired: false,
          isUsed: false,
        }
      });

      if( !App.isObject(mAccessRecovery) || !App.isPosNumber(mAccessRecovery.id) )
        return App.json(res, 417, App.t(['verification','code','not-found'], req.lang));

      const password_0 = req.getCommonDataString('password') || '';
      const password_1 = req.getCommonDataString('passwordRepeat') || ''

      if( !password_0 || !password_0 /* || !old_password */ )
        return App.json( res, 417, App.t('provide-valid-password', req.lang) ); 

      if( !App.tools.isValidPassword(password_0) )
        return App.json( res, 417, App.t('password-must-be...', req.lang)  ); 

      // if( !( await App.BCrypt.compare( old_password, mUser.password ) ) )
      //   return App.json( res, 417, App.t(['wrong','password'])); 

      if( password_0 !== password_1 )
        return App.json( res, 417, App.t('password-does-not-match', req.lang) ); 

      const hash = await App.BCrypt.hash( password_0 );
      if( !hash )
        return App.json( res, false, App.t('request-could-not-be-processed', req.lang) );

      // const destroyRes = await App.getModel('Session').destroy({
      //   where: { userId: mUser.id },
      // });

      const mUser = await App.getModel('User').getById( mAccessRecovery.userId );
      if( !App.isObject(mUser) || !App.isPosNumber(mUser.id) )
        return App.json(res, 417, App.t(['user','not-found'], req.lang));

      const updateUser = await mUser.update({ password: hash });
      if( !App.isObject(updateUser) || !App.isPosNumber(updateUser.id) )
        return App.json(res, false, App.t(['failed-to','update','user'], req.lang));

      await mAccessRecovery.update({isUsed: true});

      App.json(res, true, App.t(['You can now log into your account'], req.lang));

    }catch(e){
      console.log(e);
      App.onRouteError( req, res, e );
      // App.json( res, false, App.t('request-could-not-be-processed', req.lang) );
    }

  });

  return { router, method: 'POST', autoDoc:{} };

};


