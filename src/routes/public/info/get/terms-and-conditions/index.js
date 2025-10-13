const express = require('express');
const router = express.Router();

// https://api.3dmadcat.ru/public/info/get/privacy-policy
// https://api.3dmadcat.ru/public/info/get/terms-and-conditions

module.exports = function(App, RPath){

  router.use('', async(req, res)=>{

    try{

      const pagination = req.getPagination({ limit: 25 });
      pagination.orderBy = App.getModel('TermsAndConditions').getOrderBy( pagination.by );
      const mTermsAndConditions = await App.getModel('TermsAndConditions').getLatest( pagination );

      if( !App.isObject(mTermsAndConditions) || !App.isPosNumber(mTermsAndConditions.id) )
        return App.json( res, 404, App.t(['terms','and','conditions','not-found'], req.lang) );

      App.json( res, true, App.t(['success'], req.lang), mTermsAndConditions );

    }catch(e){
      console.log(e);
      App.onRouteError( req, res, e );
      // App.json( res, false, App.t('request-could-not-be-processed', req.lang) );
    }

  });

  return { router, method: '', autoDoc:{} };

};


