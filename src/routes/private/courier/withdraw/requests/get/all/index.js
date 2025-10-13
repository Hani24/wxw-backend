const express = require('express');
const router = express.Router();

// /private/courier/withdraw/requests/get/all

module.exports = function(App, RPath){

  router.use('', async(req, res)=>{

    try{

      // return App.json(res, 417, App.t(['disabled'], req.lang));

      const data = req.getPost();
      const mUser = await req.user;
      const mCourier = await req.courier;

      const verifyAccessRes = App.getModel('Courier').verifyAccess( mCourier );
      if( !verifyAccessRes.success )
        return App.json(res, 417, App.t(verifyAccessRes.message, req.lang), verifyAccessRes.data);

      const {offset, limit, order, by} = req.getPagination({});
      const orderBy = App.getModel('CourierWithdrawRequest').getOrderBy(by);

      const mCourierWithdrawRequests = await App.getModel('CourierWithdrawRequest')
        .getAllByCourierId( mCourier.id, {offset,limit,order,by});

      App.json( res, true, App.t(['success'], res.lang), mCourierWithdrawRequests );

    }catch(e){
      console.log(e);
      App.onRouteError( req, res, e );
      // App.json( res, false, App.t('request-could-not-be-processed', req.lang) );
    }

  });

  return { router, method: '', autoDoc:{} };

};

