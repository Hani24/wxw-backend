const express = require('express');
const router = express.Router();

// {
//   "id": "required: <number> Ref.PrivacyPolicyItem.id",
//   "itemTitle": "required: <string>: max: 255 bytes",
//   "itemText": "required: <string>: max: 65535 bytes"
// }

module.exports = function(App, RPath){

  router.use('', async(req, res)=>{

    try{

      const data = req.getPost();
      const mUser = await req.user; // admin

      const id = App.getPosNumber(req.getCommonDataInt('id', null));

      if( !App.isPosNumber(id) )
        return App.json( res, 417, App.t(['privacy','policy','item','id','is-required'], req.lang) );

      const mPrivacyPolicyItem = await App.getModel('PrivacyPolicyItem').findOne({
        where: {
          id,
          isDeleted: false,
        },
      });

      if( !App.isObject(mPrivacyPolicyItem) || !App.isPosNumber(mPrivacyPolicyItem.id) )
        return App.json( res, 404, App.t(['privacy','policy','item','not-found'], req.lang) );

      const privacyPolicyItem_t = {
        itemTitle: req.getCommonDataString('itemTitle', '').substr(0,255-1), // TEXT: (1) byte(s) reserved by db
        itemText: req.getCommonDataString('itemText', '').substr(0,65535-2), // TEXT: (2) byte(s) reserved by db
      };

      if( !App.isString(privacyPolicyItem_t.itemTitle) || !privacyPolicyItem_t.itemTitle.length )
        return App.json( res, 417, App.t(['privacy','policy','item','title','is-required'], req.lang) );

      if( !App.isString(privacyPolicyItem_t.itemText) || !privacyPolicyItem_t.itemText.length )
        return App.json( res, 417, App.t(['privacy','policy','item','text','is-required'], req.lang) );

      const updatePrivacyPolicyItem = await mPrivacyPolicyItem.update( privacyPolicyItem_t );
      if( !App.isObject(updatePrivacyPolicyItem) || !App.isPosNumber(updatePrivacyPolicyItem.id) )
        return App.json( res, false, App.t(['failed-to','update','privacy','policy','item',], req.lang) );

      App.json( res, true, App.t(['privacy','policy','item','has-been','updated'], res.lang), updatePrivacyPolicyItem );

    }catch(e){
      console.log(e);
      App.onRouteError( req, res, e );
      // App.json( res, false, App.t('request-could-not-be-processed', req.lang) );
    }

  });

  return { router, method: '', autoDoc:{} };

};

