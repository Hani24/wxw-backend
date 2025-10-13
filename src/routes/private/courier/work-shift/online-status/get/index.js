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

      App.json( res, true, App.t(['success'], res.lang),{
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


