const express = require('express');
const router = express.Router();

module.exports = function(App, RPath){

  router.use('', async(req, res)=>{

    try{

      App.html(res, await App.Mailer.createEmailTemplate('admin-access-recovery', { 
        lang: 'en',
        code: 'code',
        path: App.toAppPath( 'web', 'admin.access-recovery-verify', 'code', false),
      }));

    }catch(e){
      console.log(e);
      App.onRouteError( req, res, e );
      // App.json( res, false, App.t('request-could-not-be-processed', req.lang) );
    }

  });

  return { router, method: '', autoDoc:{} };

};


