const express = require('express');
const router = express.Router();

// /public/user/common/is/restricted/id/:id

module.exports = function(App, RPath){

  router.use('', async(req, res)=>{

    try{

      // const data = req.getPost();
      const id = req.getCommonDataInt('id', null);
      if( !App.isPosNumber(id) )
        return await App.json( res, 417, App.t(['id','is-required'], req.lang) );

      const mUser = await App.getModel('User').findOne({
        where: {id},
        attributes: ['id','isRestricted','isDeleted'],
      });

      if( !App.isObject(mUser) || !App.isPosNumber(mUser.id) )
        return await App.json( res, 404, App.t(['user','not-found'], req.lang) );

      const isRestricted = mUser.isRestricted || mUser.isDeleted;

      await App.json( res, 200, App.t(['success'], req.lang), {
        isRestricted
      });

    }catch(e){
      console.log(e);
      App.onRouteError( req, res, e );
      // App.json( res, false, App.t('request-could-not-be-processed', req.lang) );
    }

  });

  return { router, method: '', autoDoc:{} };

};


