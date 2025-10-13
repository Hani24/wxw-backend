const express = require('express');
const router = express.Router();

module.exports = function(App, RPath){

  router.use('', async(req, res)=>{
    try{
      App.json( res, 417, App.t('some 417 explanation', req.lang) );
    }catch(e){
      console.log(e);
      App.onRouteError( req, res, e );
      // App.json( res, false, App.t('request-could-not-be-processed', req.lang) );
    }
  });
  return { router, method: '', autoDoc:{} };
};


