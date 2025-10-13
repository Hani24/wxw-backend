const express = require('express');
const router = express.Router();

// /private/common/logout/

// {
//   "fromAllAccount": "optional: [boolean]: default: false"
// }

// UPDATE: 2022-07-17: boards-34 / MAI-861
//   If user logs out or switched from Driver to Client or vice versa - 
//   he should no longer receive any notifications meant for another user

module.exports = function(App, RPath){

  router.use('', async(req, res)=>{

    try{

      const mUser = await req.user;
      const mClient = await req.client;
      const mCourier = await req.courier;
      const mSession = await req.session;

      const fromAllAccount = App.getBoolFromValue(req.getCommonDataString('fromAllAccount', false));

      // keep record for any-case ?
      // const updateRes = await mSession.update({
      //   isDeleted: true, 
      // });

      // if( !App.isObject(updateRes) || !App.isPosNumber(updateRes.id) )
      //   return App.json( res, false, App.t(['could-not','logout'], res.lang));

      if( App.isObject(mClient) && App.isPosNumber(mClient.id) ){
        // allow sign out
      }

      if( App.isObject(mCourier) && App.isPosNumber(mCourier.id) ){
        if( mCourier.hasActiveOrder || mCourier.activeOrderId )
          return await App.json( res, 417, App.t(['You have active order and cannot sign-out, please cancel order and try again'], res.lang));
        // allow sign out

        if( mCourier.isOnline )
          return await App.json( res, 417, App.t(['Please stop your work-shift, and try again'], res.lang));

      }

      if( fromAllAccount ){

        const destroyAllRes = await App.getModel('Session').destroy({
          where: { userId: mUser.id }
        });

        if( !App.isArray(destroyAllRes) || !destroyAllRes.length )
          return App.json( res, false, App.t(['could-not','logout','from','all','accounts'], res.lang));

        return await App.json( res, true, App.t(['success'], res.lang), {});

      }


      const destroyRes = await mSession.destroy();
      if( !App.isObject(destroyRes) || !App.isPosNumber(destroyRes.id) )
        return App.json( res, false, App.t(['could-not','logout'], res.lang));

      const openSessions = await App.getModel('Session').findAll({
        where: {
          userId: mUser.id,
          isDeleted: false,
        },
        attributes: ['id','ip','timezone','deviceId'],
      });

      App.json( res, true, App.t(['success'], res.lang), {
        openSessions,
      });

      // App.json( res, true, App.t(['success'], res.lang));

    }catch(e){
      console.log(e);
      App.onRouteError( req, res, e );
      // App.json( res, false, App.t('request-could-not-be-processed', req.lang) );
    }

  });

  return { router, method: '', autoDoc:{} };

};


