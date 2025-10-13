const express = require('express');
const router = express.Router();

// /public/dev/error-test/200
// /public/dev/error-test/401
// /public/dev/error-test/403
// /public/dev/error-test/417
// /public/dev/error-test/500

module.exports = function(App, RPath){

  router.use('', async(req, res)=>{
    try{
      App.json(res, 403, App.t(['forbidden'], req.lang));
    }catch(e){
      console.log(e);
      App.onRouteError( req, res, e );
      // App.json( res, false, App.t('request-could-not-be-processed', req.lang) );
    }
  });
  return { router, method: '', autoDoc:{} };
};


