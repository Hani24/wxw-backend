const express = require('express');
const router = express.Router();

// /private/admin/info/privacy-policy/get/all/

module.exports = function(App, RPath){

  router.use('', async(req, res)=>{

    try{

      const pagination = req.getPagination({ limit: 25 });
      pagination.orderBy = App.getModel('PrivacyPolicy').getOrderBy( pagination.by );

      const mPrivacyPolicy = await App.getModel('PrivacyPolicy').getLatest( pagination );
      if( !App.isObject(mPrivacyPolicy) || !App.isPosNumber(mPrivacyPolicy.id) )
        return App.json( res, 404, App.t(['privacy','policy','not-found'], req.lang) );

      App.json( res, true, App.t(['success'], req.lang), mPrivacyPolicy );

    }catch(e){
      console.log(e);
      App.onRouteError( req, res, e );
      // App.json( res, false, App.t('request-could-not-be-processed', req.lang) );
    }

  });

  return { router, method: '', autoDoc:{} };

};


