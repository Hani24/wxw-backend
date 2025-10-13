const express = require('express');
const router = express.Router();


// UPDATE: 2022-07-17: boards-34 / MAI-861
//   If user logs out or switched from Driver to Client or vice versa - 
//   he should no longer receive any notifications meant for another user

module.exports = function(App, RPath){

  router.use('', async(req, res)=>{

    try{

      // if( App.isEnv('dev') )
      //   return App.json( res, true, App.t(['success'], res.lang) );

      const data = req.getPost();
      const mUser = await req.user;
      const mCourier = await req.courier;

      // const verifyAccess = App.getModel('Courier').verifyAccess( mCourier );
      // if( !verifyAccess.success )
      //   return App.json(res, 417, App.t(verifyAccess.message, req.lang));

      if( App.isObject(mCourier) && App.isPosNumber(mCourier.id) ){
        if( mCourier.hasActiveOrder || mCourier.activeOrderId )
          return await App.json( res, 417, App.t(['You have active order and cannot stop your work-shift, please cancel order and try again'], res.lang));
        // allow sign out
      }

      const mCourierShift = await App.getModel('CourierShift').getByCourierId(mCourier.id);
      if( !App.isObject(mCourierShift) || !App.isPosNumber(mCourierShift.id) )
        return App.json( res, false, App.t(['failed-to','get','work-shift'], req.lang) );

      // not required, stop it anyway
      // if( !mCourierShift.isStarted )
      //   return App.json( res, 417, App.t(['start','your','work-shift','first'], req.lang) );

      const tx = await App.DB.sequelize.transaction( App.DB.getTxOptions());

      try{

        const updateCourierShift = await mCourierShift.update({
          isEnded: true,
          endedAt: App.getISODate(),
        }, {transaction: tx});

        // console.json({updateCourierShift});
        if( !App.isObject(updateCourierShift) || !App.isPosNumber(updateCourierShift.id) ){
          await tx.rollback();
          return App.json( res, false, App.t(['failed-to','stop','work-shift'], req.lang) );
        }

        const updateCourier = await mCourier.update({
          isOnline: false,
        }, {transaction: tx});

        // console.json({updateCourier});
        if( !App.isObject(updateCourier) || !App.isPosNumber(updateCourier.id) ){
          await tx.rollback();
          return App.json( res, false, App.t(['failed-to','update','online','status'], req.lang) );
        }

        await tx.commit();

      }catch(e){
        console.error(` stop [work-shift]: ${e.message}`)
        await tx.rollback();
        return App.json( res, false, App.t(['failed-to','update','work-shift'], req.lang) );
      }

      App.json( res, true, App.t(['success'], res.lang),{
        isStarted: mCourierShift.isStarted,
        startedAt: mCourierShift.startedAt,
        isEnded: mCourierShift.isEnded,
        endedAt: mCourierShift.endedAt,
        isOnline: mCourier.isOnline,
      });

    }catch(e){
      console.log(e);
      App.onRouteError( req, res, e );
      // App.json( res, false, App.t('request-could-not-be-processed', req.lang) );
    }

  });

  return { router, method: '', autoDoc:{} };

};


