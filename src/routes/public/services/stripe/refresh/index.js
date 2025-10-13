const express = require('express');
const router = express.Router();
const Stripe = require('stripe');

// /public/services/stripe/refresh/account/id/<account-id>
// /public/services/stripe/return/account/id/<account-id>

module.exports = function(App, RPath){

  router.use('', /* express.raw({type: 'application/json'}), */ async(req, res)=>{

    try{

      return await App.renderUI( res, 'message', {
        header: App.t(['Info'], req.lang),
        message: App.t(['Please use Your App to complete all required steps'], req.lang, ''),
        // icon: { name: 'error', size: 100 },
      });

      // const data = req.getPost();
      // const accountId = `acct_${req.getCommonDataString('id', null)}`;

      // if( !accountId || !(await App.getModel('Courier').isset({accountId})) )
      //   return await App.renderUI( res, 'message', {
      //     header: App.t(['Unknown customer'], req.lang),
      //     message: App.t(['Customer','not','found'], req.lang, ''),
      //     icon: { name: 'error', size: 100 },
      //   });

      // const accountRes = await this.accountGetById( accountId );
      // // accountRes

      // console.json({accountRes});

      // // App.json( res, true, App.t(['success'], req.lang), {accountId} );

      // await App.renderUI( res, 'message', {
      //   header: App.t(['Thank you!'], req.lang),
      //   message: App.t(['Your email address has been verified.','You can now log into your account'], req.lang, ''),
      //   icon: { name: 'success', size: 100 },
      // });

    }catch(e){
      console.log(e);
      await App.renderUI( res, 'message', {
        header: App.t(['Error'], req.lang),
        message: App.t(['request-could-not-be-processed'], req.lang, ''),
        icon: { name: 'error', size: 100 },
      });
      // App.onRouteError( req, res, e );
      // App.json( res, false, App.t('request-could-not-be-processed', req.lang) );
    }

  });

  return { router, method: '', autoDoc:{} };

};


