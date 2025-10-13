const express = require('express');
const router = express.Router();

// /public/dev/internal/user/delete/id/:id

module.exports = function(App, RPath){

  router.use('', async(req, res)=>{

    try{

      const id = req.getCommonDataInt('id', null);

      if( !App.isPosNumber(id) )
        return await App.json( res, 417, App.t('User ID is required', req.lang) );

      const isset = await App.getModel('User').isset({id});
      if( !isset )
        return App.json( res, 404, App.t(['User with ID not found'], req.lang) );


      const mCourier = await App.getModel('Courier').findOne({
        where: {
          userId: id,
        },
        attributes: [
          'id'
        ]
      });

      if( mCourier && mCourier.id ){
        await App.getModel('Courier').update(
          {
            activeOrderId: null // remove active order from current Coutier
          },
          {
            where: {
              id: mCourier.id
            }            
          }
        );        
      }

      // this will destroy all related table-records because we use DELETE CASCADE, UPDATE CASCADE

      // destroy [courier] if exists
      const courier = await App.getModel('Courier').destroy({
        where: {
          userId: id
        },
      });

      // destroy [user] if exists
      const user = await App.getModel('User').destroy({
        where: {
          id
        },
      });


      App.json( res, true, App.t('User ID deleted', req.lang), {
        courier,
        user,
      });

    }catch(e){
      console.log(e);
      App.onRouteError( req, res, e );
      // App.json( res, false, App.t('request-could-not-be-processed', req.lang) );
    }

  });

  return { router, method: '', autoDoc:{} };

};
