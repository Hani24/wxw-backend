const express = require('express');
const router = express.Router();

// /private/client/cart/empty

module.exports = function(App, RPath){

  router.use('', async(req, res)=>{

    try{

      const mUser = await req.user;
      const mClient = await req.client;
      const data = req.getPost();

      const isEmpty = await App.getModel('Cart').emptyByClientId(mClient.id);

      // Also discard any unpaid/unconfirmed orders when cart is emptied
      const statuses = App.getModel('Order').getStatuses();
      await App.getModel('Order').update(
        { status: statuses['discarded'] },
        {
          where: {
            clientId: mClient.id,
            status: statuses['created'],
            isPaid: false,
          }
        }
      );

      App.json( res, true, App.t('success', res.lang), {isEmpty} );

    }catch(e){
      console.log(e);
      App.onRouteError( req, res, e );
      // App.json( res, false, App.t('request-could-not-be-processed', req.lang) );
    }

  });

  return { router, method: '', autoDoc:{} };

};


