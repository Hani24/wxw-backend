const express = require('express');
const router = express.Router();

module.exports = function(App, RPath){

  router.use('', async(req, res)=>{

    try{

      const data = req.getPost();
      const mUser = await req.user;
      const mCourier = await req.courier;

      const verifyAccessRes = App.getModel('Courier').verifyAccess( mCourier );
      if( !verifyAccessRes.success )
        return App.json(res, 417, App.t(verifyAccessRes.message, req.lang), verifyAccessRes.data);

      // if( !mCourier.isOnline )
      //   return App.json(res, 417, App.t(['online-status'], req.lang));

      // NOTE: to be confirmed ....

      // const mCourierShift = await App.getModel('CourierShift').getByCourierId(mCourier.id);

      // if( !App.isObject(mCourierShift) || !App.isPosNumber(mCourierShift.id) )
      //   return App.json( res, false, App.t(['failed-to','get','work-shift'], req.lang) );

      // if( !mCourierShift.isStarted )
      //   return App.json( res, 417, App.t(['start','your','work-shift','first'], req.lang) );

      App.json( res, true, App.t(['success'], res.lang), {
        lat: (+mCourier.lat),
        lon: (+mCourier.lon),
      });

    }catch(e){
      console.log(e);
      App.onRouteError( req, res, e );
      // App.json( res, false, App.t('request-could-not-be-processed', req.lang) );
    }

  });

  return { router, method: '', autoDoc:{} };

};


