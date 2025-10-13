const express = require('express');
const router = express.Router();

// /public/stripe/dev/payment-intend/create/

module.exports = function(App, RPath){

  router.use('', async(req, res)=>{

    try{

      const mUser = await req.user;
      const data = req.getPost();

      const DEV_CUST = 'cus_KbgYP89ZbqNnx7';
      const PROD_CUST = 'cus_KbirCvG4T3Mgym';
      const DEV_TEST_CUSTOMER = DEV_CUST;

      const DEV_PM = 'pm_1JwVf8LkgFoZ4U2Th9ALxh1D';
      const DEV_TEST_PM = DEV_PM;

      const paymentIntent = await App.payments.stripe._stripe.paymentIntents.create({
        // confirm: true, // default: false,
        receipt_email: 'ch3ll0v3k@yandex.com',
        payment_method_types: ['card'],
        amount: 546,
        currency: 'eur',
        customer: DEV_TEST_CUSTOMER,
        payment_method: DEV_TEST_PM,
        description: 'Order: #1000001232'
      });

      const { client_secret } = paymentIntent;

      return App.json( res, true, App.t(['success'], res.lang), {
        client_secret,
        customer: DEV_TEST_CUSTOMER,
        payment_method: DEV_TEST_PM,        
      } );

    }catch(e){
      console.log(e);
      App.onRouteError( req, res, e );
      // App.json( res, false, App.t('request-could-not-be-processed', req.lang) );
    }

  });

  return { router, method: '', autoDoc:{} };

};


