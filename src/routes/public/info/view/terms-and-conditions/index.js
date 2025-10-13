const express = require('express');
const router = express.Router();

// https://api.3dmadcat.ru/public/info/view/privacy-policy/privacy-policy
// https://api.3dmadcat.ru/public/info/view/privacy-policy/terms-and-conditions

module.exports = function(App, RPath){

  router.use('', async(req, res)=>{

    try{

      const pagination = req.getPagination({ limit: 25 });
      pagination.orderBy = App.getModel('TermsAndConditions').getOrderBy( pagination.by );
      const mTermsAndConditions = await App.getModel('TermsAndConditions').getLatest( pagination );

      if( !App.isObject(mTermsAndConditions) || !App.isPosNumber(mTermsAndConditions.id) )
        throw Error(` #mTermsAndConditions:getLatest: not-found`);

      return await App.renderUI( res, 'common-info-and-text', {
        title: `Terms and conditions - ${App.getAppName()}`,
        content: {
          partial: '/info/terms-and-conditions',
          data: {
            data: { mTermsAndConditions }
          }
        },
      });        

    }catch(e){
      console.error(`path: ${req.path}: ${e.message}`);
      // App.onRouteError( req, res, e );
      // App.json( res, false, App.t('request-could-not-be-processed', req.lang) );

      return await App.renderUI( res, 'message', {
        header: App.t(['terms','and','conditions'], req.lang),
        message: App.t(['privacy','policy','not-found'], req.lang),
        icon: { name: 'error', size: 100 },
      });

    }

  });

  return { router, method: '', autoDoc:{} };

};


