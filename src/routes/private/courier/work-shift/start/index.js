const express = require('express');
const router = express.Router();

module.exports = function(App, RPath){

  router.use('', async(req, res)=>{

    try{

      const data = req.getPost();
      const mUser = await req.user;
      const mCourier = await req.courier;

      // console.debug({mCourier: {id: mCourier.id}});

      const verifyAccess = App.getModel('Courier').verifyAccess( mCourier );
      if( !verifyAccess.success )
        return App.json(res, 417, App.t(verifyAccess.message, req.lang));

      const mCourierShift = await App.getModel('CourierShift').getByCourierId(mCourier.id);
      if( !App.isObject(mCourierShift) || !App.isPosNumber(mCourierShift.id) )
        return App.json( res, false, App.t(['failed-to','get','work-shift'], req.lang) );

      // not required, start it anyway
      // if( mCourierShift.isStarted )
      //   return App.json( res, true, App.t(['already','started'], req.lang), {
      //     isStarted: mCourierShift.isStarted,
      //     startedAt: mCourierShift.startedAt,          
      //     isOnline: mCourier.isOnline,          
      //   });

      const tx = await App.DB.sequelize.transaction( App.DB.getTxOptions());

      try{

        const updateCourierShift = await mCourierShift.update({
          isStarted: true,
          startedAt: App.getISODate(),
        }, {transaction: tx});

        // console.json({updateCourierShift});
        if( !App.isObject(updateCourierShift) || !App.isPosNumber(updateCourierShift.id) ){
          await tx.rollback();
          return App.json( res, false, App.t(['failed-to','start','work-shift'], req.lang) );
        }

        const updateCourier = await mCourier.update({
          isOnline: true,
        }, {transaction: tx});

        // console.json({updateCourier});
        if( !App.isObject(updateCourier) || !App.isPosNumber(updateCourier.id) ){
          await tx.rollback();
          return App.json( res, false, App.t(['failed-to','update','online','status'], req.lang) );
        }

        await tx.commit();

      }catch(e){
        console.error(` start [work-shift]: ${e.message}`)
        await tx.rollback();
        return App.json( res, false, App.t(['failed-to','update','work-shift'], req.lang) );
      }

      console.debug({mCourier:{ id: mCourier.id, isOnline: mCourier.isOnline }});

      App.json( res, true, App.t(['success'], res.lang),{
        isStarted: mCourierShift.isStarted,
        startedAt: mCourierShift.startedAt,
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


