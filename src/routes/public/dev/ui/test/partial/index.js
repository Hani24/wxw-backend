const express = require('express');
const router = express.Router();

// /public/dev/ui/test/partial/

module.exports = function(App, RPath){

  router.use('', async(req, res)=>{

    try{

      return await App.renderUI( res, 'inject-content', {
        title: 'This is sub title of partial',
        header: App.t(['Thank you!', `${App.getEnv('APP_NAME')} Team`], req.lang,'<br/>'),
        // message: App.t(['Success message'], req.lang),
        icon: { name: 'success', size: 100 },
        content: {
          partial: '/test-template/partial-name',
          data: {}
        },
      });

      // return await App.renderUI( res, 'message', {
      //   header: App.t(['Error <title>'], req.lang),
      //   message: App.t(['Error','<message>'], req.lang),
      //   icon: { name: 'error', size: 100 },
      // });        

    }catch(e){
      console.log(e);
      App.onRouteError( req, res, e );
      // App.json( res, false, App.t('request-could-not-be-processed', req.lang) );
    }

  });

  return { router, method: '', autoDoc:{} };

};


