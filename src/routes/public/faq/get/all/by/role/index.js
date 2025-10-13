const express = require('express');
const router = express.Router();

// {
//   "role": "optional: ENUM: <string>: [ client | courier | restaurant ]: default: client"
// }

// {
//   "role": "client"
// }

// /public/faq/get/all/by/role/:role/?offset=0&limit=15&order=desc

module.exports = function(App, RPath){

  router.use('', async(req, res)=>{

    try{

      const mUser = await req.user;
      const data = req.getPost();

      const {offset, limit, order, by} = req.getPagination({});
      const orderBy = App.getModel('Faq').getOrderBy(by);
      const roles = App.getModel('Faq').getRoles({asArray: false});

      let role = req.getCommonDataString('role', 'client');
      if( !role || !roles.hasOwnProperty(role) ){
        role = roles.client;
        // return App.json( res, 417, App.t(['role','is-not','valid'], res.lang), {roles, role} );
      }

      const mFaqs = await App.getModel('Faq').findAndCountAll({
        where: {
          role,
          isDisabled: false,
          isDeleted: false,
        },
        attributes: [
          'id','role','q','a','updatedAt','createdAt'
        ],
        order: [[ orderBy, order ]],
        offset: offset,
        limit: limit,
      });

      // console.json({mFaqs});
      App.json( res, true, App.t(['success'], res.lang), mFaqs );

    }catch(e){
      console.log(e);
      App.onRouteError( req, res, e );
      // App.json( res, false, App.t('request-could-not-be-processed', req.lang) );
    }

  });

  return { router, method: '', autoDoc:{} };

};


