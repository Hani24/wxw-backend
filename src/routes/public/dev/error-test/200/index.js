const express = require('express');
const router = express.Router();

module.exports = function(App, RPath){

  router.use('', async(req, res)=>{
    try{
      App.json( res, 200, App.t('success', req.lang) );
    }catch(e){
      console.log(e);
      App.onRouteError( req, res, e );
      // App.json( res, false, App.t('request-could-not-be-processed', req.lang) );
    }
  });
  return { router, method: '', autoDoc:{} };
};


