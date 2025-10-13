const express = require('express');
const router = express.Router();

// {
//   "id": "required: <number>: Ref. Faq.id",
//   "q": "required: <string>: question",
//   "a": "required: <string>: answer"
// }

// {
//   "id": 3,
//   "q": "test: updated",
//   "a": "test: updated"
// }

// /private/admin/faq/update/by/id/:id

module.exports = function(App, RPath){

  router.use('', async(req, res)=>{

    try{

      const mUser = await req.user;
      const data = req.getPost();

      const faq_t = {
        id: req.getCommonDataInt('id', null),
        q: req.getCommonDataString('q', null),
        a: req.getCommonDataString('a', null),
      };

      if( !App.isPosNumber(faq_t.id) )
        return App.json( res, 417, App.t(['faq','item','id','is-required'], res.lang) );

      if( !App.isString(faq_t.q) || !App.isString(faq_t.a) )
        return App.json( res, 417, App.t(['question','and','answer','is-required'], res.lang) );

      const mFaq = await App.getModel('Faq').getByFields({ id: faq_t.id });
      if( !App.isObject(mFaq) || !App.isPosNumber(mFaq.id) )
        return App.json( res, 404, App.t(['faq','item','not','found'], res.lang) );

      const updatedRes = await mFaq.update( faq_t );
      if( !App.isObject(updatedRes) || !App.isPosNumber(updatedRes.id) )
        return App.json( res, false, App.t(['failed-to','update','faq','item'], res.lang) );

      App.json( res, true, App.t(['success'], res.lang), {
        id: updatedRes.id,
        role: updatedRes.role,
        q: updatedRes.q,
        a: updatedRes.a,
        updatedAt: updatedRes.updatedAt,
      } );

    }catch(e){
      console.log(e);
      App.onRouteError( req, res, e );
      // App.json( res, false, App.t('request-could-not-be-processed', req.lang) );
    }

  });

  return { router, method: 'post', autoDoc:{} };

};


