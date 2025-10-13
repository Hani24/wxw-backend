const express = require('express');
const router = express.Router();

// /public/system/states/get/all/?offset=0&limit=100&order=desc

module.exports = function(App, RPath){

  router.use('', async(req, res)=>{

    try{

      const data = req.getPost();
      const mUser = await req.user;

      const {offset, limit, order, by} = req.getPagination({ limit: 100 });
      const orderBy = App.getModel('State').getOrderBy(by);

      const mStates = await App.getModel('State').findAndCountAll({
        where: {
          isEnabled: true,
        },
        distinct: true,
        attributes: [
          'id','name','code'
        ],
        // include: [{
        //   model: App.getModel('City'),
        //   attributes: ['id','name'],
        // }],
        order: [[ orderBy, order ]],
        offset: offset,
        limit: limit,
      });

      return App.json( res, true, App.t(['success'], res.lang), mStates );

    }catch(e){
      console.log(e);
      App.onRouteError( req, res, e );
      // App.json( res, false, App.t('request-could-not-be-processed', req.lang) );
    }

  });

  return { router, method: '', autoDoc:{} };

};


