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

// /private/admin/info/terms-and-conditions/create/item/

module.exports = function(App, RPath){

  router.use('', async(req, res)=>{

    try{

      const data = req.getPost();
      const mUser = await req.user; // admin

      const termsAndConditionsItem_t = {
        itemTitle: req.getCommonDataString('itemTitle', '').substr(0,255-1), // TEXT: (1) byte(s) reserved by db
        itemText: req.getCommonDataString('itemText', '').substr(0,65535-2), // TEXT: (2) byte(s) reserved by db
      };

      if( !App.isString(termsAndConditionsItem_t.itemTitle) || !termsAndConditionsItem_t.itemTitle.length )
        return App.json( res, 417, App.t(['terms','and','conditions','item','title','is-required'], req.lang) );

      if( !App.isString(termsAndConditionsItem_t.itemText) || !termsAndConditionsItem_t.itemText.length )
        return App.json( res, 417, App.t(['terms','and','conditions','item','text','is-required'], req.lang) );

      const mTermsAndConditions = await App.getModel('TermsAndConditions').getLatest({limit: 1});
      if( !App.isObject(mTermsAndConditions) || !App.isPosNumber(mTermsAndConditions.id) )
        return App.json( res, 404, App.t(['terms','and','conditions','not-found'], req.lang) );

      const mTermsAndConditionsItem = await App.getModel('TermsAndConditionsItem').create({
        termsAndConditionsId: mTermsAndConditions.id,
        ...termsAndConditionsItem_t,
      });

      if( !App.isObject(mTermsAndConditionsItem) || !App.isPosNumber(mTermsAndConditionsItem.id) )
        return App.json( res, false, App.t(['failed-to','create','terms','and','conditions','item',], req.lang) );

      App.json( res, true, App.t(['terms','and','conditions','item','has-been','created'], res.lang), mTermsAndConditionsItem );

    }catch(e){
      console.log(e);
      App.onRouteError( req, res, e );
      // App.json( res, false, App.t('request-could-not-be-processed', req.lang) );
    }

  });

  return { router, method: '', autoDoc:{} };

};

