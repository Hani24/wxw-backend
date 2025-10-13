const express = require('express');
const router = express.Router();

// https://api.3dmadcat.ru/public/info/view/privacy-policy
// https://api.3dmadcat.ru/public/info/view/terms-and-conditions

module.exports = function(App, RPath){

  router.use('', async(req, res)=>{

    try{

      const pagination = req.getPagination({ limit: 25 });
      pagination.orderBy = App.getModel('PrivacyPolicy').getOrderBy( pagination.by );
      const mPrivacyPolicy = await App.getModel('PrivacyPolicy').getLatest( pagination );

      if( !App.isObject(mPrivacyPolicy) || !App.isPosNumber(mPrivacyPolicy.id) ){
        throw Error(` #mPrivacyPolicy:getLatest: not-found`);
        // return App.json( res, 404, App.t(['privacy','policy','not-found'], req.lang) );
      }

      return await App.renderUI( res, 'common-info-and-text', {
        title: `Privacy policy - ${App.getAppName()}`,
        content: {
          partial: '/info/privacy-policy',
          data: {
            data: { mPrivacyPolicy }
          }
        },
      });        

    }catch(e){
      console.error(`path: ${req.path}: ${e.message}`);
      // App.onRouteError( req, res, e );
      // App.json( res, false, App.t('request-could-not-be-processed', req.lang) );

      return await App.renderUI( res, 'message', {
        header: App.t(['privacy','policy'], req.lang),
        message: App.t(['privacy','policy','not-found'], req.lang),
        icon: { name: 'error', size: 100 },
      });

    }

  });

  return { router, method: '', autoDoc:{} };

};


