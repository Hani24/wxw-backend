const express = require('express');
const router = express.Router();

module.exports = function(App, RPath){

  router.use('', async(req, res)=>{

    try{

      return await App.renderUI( res, 'message', {
        title: 'Unknown error',
        header: App.t([`${App.getEnv('APP_NAME')} Team`], req.lang,'<br/>'),
        message: App.t(['Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.'], req.lang),
        icon: { name: 'error', size: 200 },
      });        

    }catch(e){
      console.log(e);
      App.onRouteError( req, res, e );
      // App.json( res, false, App.t('request-could-not-be-processed', req.lang) );
    }

  });

  return { router, method: '', autoDoc:{} };

};


