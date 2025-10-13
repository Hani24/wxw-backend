const express = require('express');
const router = express.Router();

// {
//   "itemTitle": "required: <string>: max: 255 bytes",
//   "itemText": "required: <string>: max: 65535 bytes"
// }

// {
//   "itemTitle": "Item title",
//   "itemText": "This is some item info text"
// }

// /private/admin/info/privacy-policy/create/item/

module.exports = function(App, RPath){

  router.use('', async(req, res)=>{

    try{

      const data = req.getPost();
      const mUser = await req.user; // admin

      const privacyPolicyItem_t = {
        itemTitle: req.getCommonDataString('itemTitle', '').substr(0,255-1), // TEXT: (1) byte(s) reserved by db
        itemText: req.getCommonDataString('itemText', '').substr(0,65535-2), // TEXT: (2) byte(s) reserved by db
      };

      if( !App.isString(privacyPolicyItem_t.itemTitle) || !privacyPolicyItem_t.itemTitle.length )
        return App.json( res, 417, App.t(['privacy','policy','item','title','is-required'], req.lang) );

      if( !App.isString(privacyPolicyItem_t.itemText) || !privacyPolicyItem_t.itemText.length )
        return App.json( res, 417, App.t(['privacy','policy','item','text','is-required'], req.lang) );

      const mPrivacyPolicy = await App.getModel('PrivacyPolicy').getLatest({limit: 1});
      if( !App.isObject(mPrivacyPolicy) || !App.isPosNumber(mPrivacyPolicy.id) )
        return App.json( res, 404, App.t(['privacy','policy','not-found'], req.lang) );

      const mPrivacyPolicyItem = await App.getModel('PrivacyPolicyItem').create({
        privacyPolicyId: mPrivacyPolicy.id,
        ...privacyPolicyItem_t,
      });

      if( !App.isObject(mPrivacyPolicyItem) || !App.isPosNumber(mPrivacyPolicyItem.id) )
        return App.json( res, false, App.t(['failed-to','create','privacy','policy','item',], req.lang) );

      App.json( res, true, App.t(['privacy','policy','item','has-been','created'], res.lang), mPrivacyPolicyItem );

    }catch(e){
      console.log(e);
      App.onRouteError( req, res, e );
      // App.json( res, false, App.t('request-could-not-be-processed', req.lang) );
    }

  });

  return { router, method: '', autoDoc:{} };

};

