const express = require('express');
const router = express.Router();

// UPDATE: 2022-07-17: boards-34 / MAI-861
//   If user logs out or switched from Driver to Client or vice versa - 
//   he should no longer receive any notifications meant for another user

// {
//   "type": "optional: ENUM: <string>: [ client | courier ]"
// }

// {
//   "type": "client",
//   "type": "courier",
// }

// /private/common/account-type/switch-to/

module.exports = function(App, RPath){

  router.use('', async(req, res)=>{

    try{

      const mUser = await req.user;
      const mClient = await req.client;
      const mCourier = await req.courier;
      const data = req.getPost();
      const roles = App.getModel('User').getRoles();

      // return App.json( res, 417, App.t(['break'], res.lang));
      const type = req.getCommonDataString('type', null);
      // console.json({data, type});

      if( App.isNull(type) )
        return App.json( res, 417, App.t(['account','type','is-required'], res.lang));

      if( type === mUser.role )
        return await App.json( res, true, App.t('success', res.lang), { type });

      if( ![roles.client, roles.courier].includes( mUser.role ) )
        return App.json( res, 417, App.t(['current','user','cannot','change','account','type'], req.lang));

      if( ![roles.client, roles.courier].includes( type ) )
        return App.json( res, 417, App.t(['selected', 'account','type','is-not','supported','for','current','user'], req.lang), {
          supported: [roles.client, roles.courier]
        });

      if( type === roles.courier && !(await App.getModel('Courier').isset({userId: mUser.id})) )
        return App.json( res, 417, App.t(['current','user','does','not','have','courier','account'], req.lang));

      // const hasCourierAccount = await App.getModel('Courier').hasCourierAccount( mUser.id );
      // if( !hasCourierAccount )
      //   return App.json( res, 417, App.t(['current','user','does','not','have','courier','account'], req.lang));

      if( App.isObject(mCourier) && App.isPosNumber(mCourier.id) ){

        if( mCourier.hasActiveOrder || mCourier.activeOrderId )
          return await App.json( res, 417, App.t(['You have active order and cannot act as client, please cancel order and try again'], res.lang));

        if( mCourier.isOnline )
          return await App.json( res, 417, App.t(['Please stop your work-shift, and try again'], res.lang));

      }

      const updateRes = await mUser.update({ role: type });
      // console.json({updateRes});
      if( !App.isObject(updateRes) || !App.isPosNumber(updateRes.id) )
        return App.json( res, false, App.t(['failed-to','update','account','type'], res.lang) );

      App.json( res, true, App.t('success', res.lang), { type: updateRes.role });

    }catch(e){
      console.log(e);
      App.onRouteError( req, res, e );
      // App.json( res, false, App.t('request-could-not-be-processed', req.lang) );
    }

  });

  return { router, method: '', autoDoc:{} };

};


