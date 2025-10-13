const express = require('express');
const router = express.Router();

module.exports = function(App, RPath){

  router.use('', async(req, res)=>{

    try{

      await console.sleep(1000);
      const {id, lat, lon} = req.getPost(); 

      if( !id || !lat || !lon )
        return await App.json( res, false, App.t('ID, LAT, LON is required', req.lang) );

      const mCourier = await App.getModel('Courier').findOne({
        where: { id },
      });

      if( !App.isObject(mCourier) )
        return await App.json( res, false, App.t('Courier not found', req.lang) );

      const updateCourier = await mCourier.update({
        lat,
        lon,
      });

      if( !App.isObject(updateCourier) )
        return await App.json( res, false, App.t('Faile to update Courier', req.lang) );

      await App.json( res, true, App.t('success', req.lang) );

    }catch(e){
      console.log(e);
      App.onRouteError( req, res, e );
      // App.json( res, false, App.t('request-could-not-be-processed', req.lang) );
    }

  });

  return { router, method: '', autoDoc:{} };

};
