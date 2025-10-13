const express = require('express');
const router = express.Router();

// /private/client/courier/create/account/

module.exports = function(App, RPath){

  router.use('', async(req, res)=>{

    try{

      const data = req.getPost();

      const mUser = await req.user;
      const mClient = await req.client;
      const roles = App.getModel('User').getRoles();

      const hasCourierAccount = await App.getModel('Courier').hasCourierAccount( mUser.id );

      if( hasCourierAccount ){
        await mUser.update({ role: roles.courier });
        return App.json( res, true, App.t(['Current user already has courier account'], req.lang));
      }

      const mCourier = await App.getModel('Courier').create({
        userId: mUser.id,
        isVerified: false, // 3days in admin-panel
        isRestricted: false,
        verifiedAt: null,
        restrictedAt: null,
        checksum: true,
      });

      if( !App.isObject(mCourier) || !App.isPosNumber(mCourier.id) )
        return App.json( res, false, App.t(['Failed to create courier account'], req.lang));

      await mUser.update({ role: roles.courier });

      App.json( res, true, App.t(['Courier account has been created'], res.lang),  );

    }catch(e){
      console.log(e);
      App.onRouteError( req, res, e );
      // App.json( res, false, App.t('request-could-not-be-processed', req.lang) );
    }

  });

  return { router, method: '', autoDoc:{} };

};


