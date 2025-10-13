const express = require('express');
const router = express.Router();

// {
//   "id": "required: <number> Ref.TermsAndConditionsItem.id"
// }

// /private/admin/info/terms-and-conditions/delete/item/by/id/

module.exports = function(App, RPath){

  router.use('', async(req, res)=>{

    try{

      const data = req.getPost();
      const mUser = await req.user; // admin

      const id = App.getPosNumber(req.getCommonDataInt('id', null));

      if( !App.isPosNumber(id) )
        return App.json( res, 417, App.t(['terms','and','conditions','item','id','is-required'], req.lang) );

      const mTermsAndConditionsItem = await App.getModel('TermsAndConditionsItem').findOne({
        where: {
          id,
          isDeleted: false,
        },
      });

      if( !App.isObject(mTermsAndConditionsItem) || !App.isPosNumber(mTermsAndConditionsItem.id) )
        return App.json( res, 404, App.t(['terms','and','conditions','item','not-found'], req.lang) );

      const updateTermsAndConditionsItem = await mTermsAndConditionsItem
        .update({
          isDeleted: true,
          deletedAt: App.getISODate(),
        });

      if( !App.isObject(updateTermsAndConditionsItem) || !App.isPosNumber(updateTermsAndConditionsItem.id) )
        return App.json( res, false, App.t(['failed-to','delete','terms','and','conditions','item',], req.lang) );

      App.json( res, true, App.t(['terms','and','conditions','item','has-been','deleted'], res.lang), updateTermsAndConditionsItem );

    }catch(e){
      console.log(e);
      App.onRouteError( req, res, e );
      // App.json( res, false, App.t('request-could-not-be-processed', req.lang) );
    }

  });

  return { router, method: '', autoDoc:{} };

};

