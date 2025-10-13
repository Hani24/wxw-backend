const express = require('express');
const router = express.Router();

module.exports = function(App, RPath){

  router.use('', async(req, res)=>{

    try{

      const data = req.getPost();

      const mUser = await req.user;
      const mRestaurant = await req.restaurant;
      const mSession = await req.session;

      const destroyRes = await mSession.destroy();
      if( !App.isObject(destroyRes) || !App.isPosNumber(destroyRes.id) )
        return App.json( res, false, App.t(['failed-to','logout'], res.lang) );

      App.json( res, true, App.t(['success'], res.lang) );

    }catch(e){
      console.log(e);
      App.onRouteError( req, res, e );
      // App.json( res, false, App.t('request-could-not-be-processed', req.lang) );
    }

  });

  return { router, method: '', autoDoc:{} };

};


