const express = require('express');
const router = express.Router();

module.exports = function(App, RPath){

  router.use('', async(req, res)=>{

    try{

      await console.sleep(1000);
      const {id, lat, lon} = req.getPost(); 

      if( !id || !lat || !lon )
        return await App.json( res, false, App.t('ID, LAT, LON is required', req.lang) );

      const mRestaurant = await App.getModel('Restaurant').findOne({
        where: { id },
      });

      if( !App.isObject(mRestaurant) )
        return await App.json( res, false, App.t('Restaurant not found', req.lang) );

      const updateRestaurant = await mRestaurant.update({
        lat,
        lon,
      });

      if( !App.isObject(updateRestaurant) )
        return await App.json( res, false, App.t('Faile to update Restaurant', req.lang) );

      await App.json( res, true, App.t('success', req.lang) );

    }catch(e){
      console.log(e);
      App.onRouteError( req, res, e );
      // App.json( res, false, App.t('request-could-not-be-processed', req.lang) );
    }

  });

  return { router, method: '', autoDoc:{} };

};
