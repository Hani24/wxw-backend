const express = require('express');
const router = express.Router();

// {
//   "role": "required: ENUM: <string>: [ client | courier | restaurant ]",
//   "q": "required: <string> question",
//   "a": "required: <string> answer"
// }

// {
//   "role": "client",
//   "q": "How to add Payment-Card",
//   "a": "To add Payment-Card go to ... and do ..."
// }

// /private/admin/faq/create

module.exports = function(App, RPath){

  router.use('', async(req, res)=>{

    try{

      const mUser = await req.user;
      const data = req.getPost();
      const roles = App.getModel('Faq').getRoles({asArray: false});
      const allowedRoles = [
        roles.client, roles.courier, roles.restaurant 
      ];

      const faq_t = {
        role: req.getCommonDataString('role', null),
        q: req.getCommonDataString('q', null),
        a: req.getCommonDataString('a', null),
      };

      if( !faq_t.role || !allowedRoles.includes(faq_t.role) )
        return App.json( res, 417, App.t(['role','is-required'], res.lang), {allowedRoles} );

      if( !App.isString(faq_t.q) || !App.isString(faq_t.a) )
        return App.json( res, 417, App.t(['question','and','answer','is-required'], res.lang) );

      const mFaq = await App.getModel('Faq').create(faq_t);
      if( !App.isObject(mFaq) || !App.isPosNumber(mFaq.id) )
        return App.json( res, false, App.t(['failed-to','create','faq','item'], res.lang) );

      App.json( res, true, App.t(['success'], res.lang), {
        id: mFaq.id,
        role: mFaq.role,
        q: mFaq.q,
        a: mFaq.a,
        createdAt: mFaq.createdAt,
      } );

    }catch(e){
      console.log(e);
      App.onRouteError( req, res, e );
      // App.json( res, false, App.t('request-could-not-be-processed', req.lang) );
    }

  });

  return { router, method: 'post', autoDoc:{} };

};


