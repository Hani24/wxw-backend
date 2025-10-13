const express = require('express');
const router = express.Router();

// {
//   "sectionTitle": "required: <string>: max: 255 bytes"
// }

// /private/admin/info/privacy-policy/update/main-section/title

module.exports = function(App, RPath){

  router.use('', async(req, res)=>{

    try{

      const mPrivacyPolicy = await App.getModel('PrivacyPolicy').getLatest({limit: 1});
      if( !App.isObject(mPrivacyPolicy) || !App.isPosNumber(mPrivacyPolicy.id) )
        return App.json( res, 404, App.t(['privacy','policy','not-found'], req.lang) );

      const privacyPolicy_t = {
        sectionTitle: req.getCommonDataString('sectionTitle', '').substr(0,255-1), // TEXT: (1) byte(s) reserved by db
      };

      if( !App.isString(privacyPolicy_t.sectionTitle) || !privacyPolicy_t.sectionTitle.length )
        return App.json( res, 417, App.t(['privacy','policy','title','is-required'], req.lang) );

      const updatePrivacyPolicy = await mPrivacyPolicy.update( privacyPolicy_t );
      if( !App.isObject(updatePrivacyPolicy) || !App.isPosNumber(updatePrivacyPolicy.id) )
        return App.json( res, false, App.t(['failed-to','update','privacy','policy','title',], req.lang) );

      App.json( res, true, App.t(['success'], req.lang), {
        sectionTitle: updatePrivacyPolicy.sectionTitle
      } );

    }catch(e){
      console.log(e);
      App.onRouteError( req, res, e );
      // App.json( res, false, App.t('request-could-not-be-processed', req.lang) );
    }

  });

  return { router, method: '', autoDoc:{} };

};


