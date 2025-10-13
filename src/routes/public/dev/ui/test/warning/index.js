const express = require('express');
const router = express.Router();

module.exports = function(App, RPath){

  router.use('', async(req, res)=>{

    try{

      return await App.renderUI( res, 'message', {
        title: 'Unknown Warning',
        header: App.t(['Warning!', `${App.getEnv('APP_NAME')} Team`], req.lang,'<br/>'),
        message: App.t(['Warning message'], req.lang),
        icon: { name: 'warning', size: 100 },
      });        

    }catch(e){
      console.log(e);
      App.onRouteError( req, res, e );
      // App.json( res, false, App.t('request-could-not-be-processed', req.lang) );
    }

  });

  return { router, method: '', autoDoc:{} };

};


