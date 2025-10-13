const express = require('express');
const router = express.Router();

// {
//   "id": "required: <number> Ref.State.id"
// }

// /public/system/cities/get/all/by/state/id/?offset=0&limit=100&order=desc

module.exports = function(App, RPath){

  router.use('', async(req, res)=>{

    try{

      const data = req.getPost();
      const mUser = await req.user;

      const {offset, limit, order, by} = req.getPagination({ limit: 1000 });
      const orderBy = App.getModel('City').getOrderBy(by);
      const id = req.getCommonDataInt('id',null);
 
      if( !App.isPosNumber(id) )
        return App.json( res, 417, App.t(['state','id','is-required'], req.lang) );

      if( !(await App.getModel('State').isset({id})) )
        return App.json( res, 404, App.t(['state','id','not','found'], req.lang) );

      const mCities = await App.getModel('City').findAndCountAll({
        where: {
          isEnabled: true,
          stateId: id,
        },
        attributes: ['id','name'],
        order: [[ orderBy, order ]],
        // offset: offset,
        // limit: limit,
      });

      return App.json( res, true, App.t(['success'], res.lang), mCities );

    }catch(e){
      console.log(e);
      App.onRouteError( req, res, e );
      // App.json( res, false, App.t('request-could-not-be-processed', req.lang) );
    }

  });

  return { router, method: '', autoDoc:{} };

};


