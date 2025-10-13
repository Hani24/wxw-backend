const express = require('express');
const router = express.Router();

// {
//   "oldPassword": "required: <string>",
//   "newPassword": "required: <string>",
//   "newPasswordRepeat": "required: <string>"
// }

// /private/admin/settings/security/set-password

module.exports = function(App, RPath){

  router.use('', async(req, res)=>{

    try{

      await console.sleep(1500); // slow down such requrest to prevent brute-force

      const data = req.getPost();
      const mUser = await req.user; // super-user
      // const mRestaurant = await req.restaurant;

      const oldPassword = App.isString( data.oldPassword ) ? data.oldPassword.trim() : false;
      const newPassword = App.isString( data.newPassword ) ? data.newPassword.trim() : false;
      const newPasswordRepeat = App.isString( data.newPasswordRepeat ) ? data.newPasswordRepeat.trim() : false;

      if( !oldPassword || !newPassword || !newPasswordRepeat )
        return App.json(res, 417, App.t(['please','enter','all','required','fields'], req.lang));

      if( !(await App.BCrypt.compare(oldPassword, mUser.password)) )
        return App.json(res, 417, App.t(['wrong','password'], req.lang));

      if( !App.tools.isValidPassword(newPassword) )
        return App.json(res, 417, App.t(['password-must-be...'], req.lang));

      if( newPassword !== newPasswordRepeat )
        return App.json(res, 417, App.t(['password-does-not-match'], req.lang));

      const password = await App.BCrypt.hash( newPassword );

      const updateUser = await mUser.update({password});
      if( !App.isObject(updateUser) || !App.isPosNumber(updateUser.id) )
        return App.json(res, false, App.t(['failed-to','update','password'], req.lang));

      App.json( res, true, App.t(['your-settings-has-been-updated'], res.lang));

      // [post-processing]
      const changePasswordEmailRes = await App.Mailer.send({
        to: mUser.email,
        subject: App.t(['password-has-been-changed'], req.lang),
        data: await App.Mailer.createEmailTemplate('admin-password-has-been-changed', { 
          lang: 'en',
          password: newPassword,
        })
      });
      
      if( !changePasswordEmailRes.success ){
        console.error(`#email: ${changePasswordEmailRes.message}`);
        console.json({changePasswordEmailRes});
      }

    }catch(e){
      console.log(e);
      App.onRouteError( req, res, e );
      // App.json( res, false, App.t('request-could-not-be-processed', req.lang) );
    }

  });

  return { router, method: '', autoDoc:{} };

};


