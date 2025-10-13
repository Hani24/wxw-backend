const express = require('express');
const router = express.Router();

// {
//   "isOnline": "required: <boolean>"
// }

// {
//   "isOnline": true
// }

// UPDATE: 2022-07-17: boards-34 / MAI-861
//   If user logs out or switched from Driver to Client or vice versa - 
//   he should no longer receive any notifications meant for another user

module.exports = function(App, RPath){

  router.use('', async(req, res)=>{

    try{

      const data = req.getPost();
      const mUser = await req.user;
      const mCourier = await req.courier;


      // Update: 2022-07-17: prevent if there is open-order
      return await App.json(res, 417, App.t(['stop your work-shift from menu'], req.lang));


      // const verifyAccess = App.getModel('Courier').verifyAccess( mCourier );
      // if( !verifyAccess.success )
      //   return App.json(res, 417, App.t(verifyAccess.message, req.lang));

      // if( !App.isBoolean(data.isOnline) )
      //   return App.json(res, 417, App.t(['set','valid','online','status'], req.lang));

      // // const mCourierShift = await App.getModel('CourierShift').getByCourierId(mCourier.id);

      // // if( !App.isObject(mCourierShift) || !App.isPosNumber(mCourierShift.id) )
      // //   return App.json( res, false, App.t(['failed-to','get','work-shift'], req.lang) );

      // // if( !mCourierShift.isStarted )
      // //   return App.json( res, 417, App.t(['start','your','work-shift','first'], req.lang) );

      // const updateRes = await mCourier.update({
      //   isOnline: App.getBoolFromValue(data.isOnline),
      // });
      // console.json({updateRes});

      // if( !App.isObject(updateRes) || !App.isPosNumber(updateRes.id) )
      //   return App.json( res, false, App.t(['failed','to','set','online','status'], req.lang));

      // App.json( res, true, App.t(['status','has-been','updated'], res.lang), {
      //   isOnline: updateRes.isOnline,
      // });

    }catch(e){
      console.log(e);
      App.onRouteError( req, res, e );
      // App.json( res, false, App.t('request-could-not-be-processed', req.lang) );
    }

  });

  return { router, method: '', autoDoc:{} };

};


