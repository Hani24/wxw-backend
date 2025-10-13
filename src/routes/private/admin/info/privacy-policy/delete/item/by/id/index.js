const express = require('express');
const router = express.Router();

// {
//   "id": "required: <number> Ref.PrivacyPolicyItem.id"
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

      const updatePrivacyPolicyItem = await mPrivacyPolicyItem
        .update({
          isDeleted: true,
          deletedAt: App.getISODate(),
        });

      if( !App.isObject(updatePrivacyPolicyItem) || !App.isPosNumber(updatePrivacyPolicyItem.id) )
        return App.json( res, false, App.t(['failed-to','delete','privacy','policy','item',], req.lang) );

      App.json( res, true, App.t(['privacy','policy','item','has-been','deleted'], res.lang), updatePrivacyPolicyItem );

    }catch(e){
      console.log(e);
      App.onRouteError( req, res, e );
      // App.json( res, false, App.t('request-could-not-be-processed', req.lang) );
    }

  });

  return { router, method: '', autoDoc:{} };

};

