const express = require('express');
const router = express.Router();

/*
{
  "id": "required: <number>: Ref. Faq.id"
}
*/

/*
{
  "id": 3
}
*/

// /private/admin/faq/delete/by/id/:id

module.exports = function(App, RPath){

  router.use('', async(req, res)=>{

    try{

      const mUser = await req.user;
      const data = req.getPost();

      const id = req.getCommonDataInt('id', null);

      if( !id )
        return App.json( res, 417, App.t(['faq','item','id','is-required'], res.lang) );

      const mFaq = await App.getModel('Faq').getByFields({ id: id });
      if( !App.isObject(mFaq) || !App.isPosNumber(mFaq.id) )
        return App.json( res, 404, App.t(['faq','item','not','found'], res.lang) );

      const updatedRes = await mFaq.update({
        // isDisabled: false,
        isDeleted: true,
        deletedAt: App.getISODate(),
      });

      if( !App.isObject(updatedRes) || !App.isPosNumber(updatedRes.id) )
        return App.json( res, false, App.t(['failed-to','update','faq','item'], res.lang) );

      App.json( res, true, App.t(['success'], res.lang), {
        id: updatedRes.id,
        role: updatedRes.role,
        q: updatedRes.q,
        a: updatedRes.a,
        isDeleted: updatedRes.isDeleted,
        deletedAt: updatedRes.deletedAt,
      } );

    }catch(e){
      console.log(e);
      App.onRouteError( req, res, e );
      // App.json( res, false, App.t('request-could-not-be-processed', req.lang) );
    }

  });

  return { router, method: 'post', autoDoc:{} };

};


