const express = require('express');
const router = express.Router();

// /private/admin/restaurants/settings/settings/search-near-by/get/

module.exports = function(App, RPath){

  router.use('', async(req, res)=>{

    try{

      const mUser = await req.user;
      const mSearchNearByClientSettings = await App.getModel('SearchNearByClientSettings').getSettings();

      if( !App.isObject(mSearchNearByClientSettings) || !App.isPosNumber(mSearchNearByClientSettings.id) )
        return App.json( res, 417, App.t(['could-not','get','settings'], res.lang), );

      App.json( res, true, App.t(['success'], res.lang), mSearchNearByClientSettings );

    }catch(e){
      console.log(e);
      App.onRouteError( req, res, e );
      // App.json( res, false, App.t('request-could-not-be-processed', req.lang) );
    }

  });

  return { router, method: 'post', autoDoc:{} };

};


