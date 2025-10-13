const express = require('express');
const router = express.Router();


module.exports = function(App, RPath){

  router.use('', async(req, res)=>{

    try{

      const { document: config } = App.upload.config.supportedTypes;

      App.json(res, true, App.t(['success'],req.lang), config );

    }catch(e){
      console.log(e);
      App.onRouteError( req, res, e );
      // App.json( res, false, App.t('request-could-not-be-processed', req.lang) );
    }

  });

  return { router, method: '', autoDoc:{} };

};


