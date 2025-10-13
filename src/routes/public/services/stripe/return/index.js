const express = require('express');
const router = express.Router();
// const Stripe = require('stripe');

// /public/services/stripe/refresh/account/id/<account-id>
// /public/services/stripe/return/account/id/<account-id>

const subFlows = {
  courier: require('./courier.sub-flow.js'),
  restaurant: require('./restaurant.sub-flow.js'),
};

module.exports = function(App, RPath){

  router.use('', App.modifiers.noBots, /* express.raw({type: 'application/json'}), */ async(req, res)=>{

    try{

      const data = req.getPost();
      const accountId = `acct_${req.getCommonDataString('id', '')}`;

      const mCourier = await App.getModel('Courier').getByFields({ accountId });
      if( App.isObject(mCourier) && App.isPosNumber(mCourier.id) )
        return await subFlows.courier(App, req, res, {data, accountId, mCourier});

      const mRestaurant = await App.getModel('Restaurant').getByFields({ accountId });
      if( App.isObject(mRestaurant) && App.isPosNumber(mRestaurant.id) )
        return await subFlows.restaurant(App, req, res, {data, accountId, mRestaurant});

      return await App.renderUI( res, 'message', {
        header: App.t(['Unknown Customer'], req.lang),
        message: App.t(['Customer','not','found'], req.lang, ''),
        icon: { name: 'error', size: 200 },
      });

    }catch(e){
      console.log(e);
      await App.renderUI( res, 'message', {
        header: App.t(['Error'], req.lang),
        message: App.t(['request-could-not-be-processed'], req.lang, ''),
        icon: { name: 'error', size: 200 },
      });
      // App.onRouteError( req, res, e );
      // App.json( res, false, App.t('request-could-not-be-processed', req.lang) );
    }

  });

  return { router, method: '', autoDoc:{} };

};