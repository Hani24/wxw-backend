const express = require('express');
const router = express.Router();

// {
//   "id": "required: <number>: Ref. CourierWithdrawRequest.id"
// }

// {
//   "id": 1
// }

// /private/courier/withdraw/requests/get/by/id

module.exports = function(App, RPath){

  router.use('', async(req, res)=>{

    try{

      // return App.json(res, 417, App.t(['disabled'], req.lang));

      const data = req.getPost();
      const mUser = await req.user;
      const mCourier = await req.courier;
      const id = req.getCommonDataInt('id',null);

      if( App.isNull(id) || !id )
        return App.json( res, 417, App.t(['request','id','is-required'], req.lang) );

      const verifyAccessRes = App.getModel('Courier').verifyAccess( mCourier );
      if( !verifyAccessRes.success )
        return App.json(res, 417, App.t(verifyAccessRes.message, req.lang), verifyAccessRes.data);

      const mCourierWithdrawRequest = await App.getModel('CourierWithdrawRequest')
        .findOne({
          where: {
            id,
            courierId: mCourier.id,
          }
        });

      if( !App.isObject(mCourierWithdrawRequest) || !App.isPosNumber(mCourierWithdrawRequest.id) )
        return App.json( res, 404, App.t(['withdraw','request','not-found'], req.lang) );

      App.json( res, true, App.t(['success'], res.lang), mCourierWithdrawRequest );

    }catch(e){
      console.log(e);
      App.onRouteError( req, res, e );
      // App.json( res, false, App.t('request-could-not-be-processed', req.lang) );
    }

  });

  return { router, method: '', autoDoc:{} };

};

