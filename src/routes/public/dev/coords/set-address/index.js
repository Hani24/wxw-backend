const express = require('express');
const router = express.Router();

module.exports = function(App, RPath){

  router.use('', async(req, res)=>{

    try{

      await console.sleep(1000);
      const {id, lat, lon} = req.getPost(); 

      if( !id || !lat || !lon )
        return await App.json( res, false, App.t('ID, LAT, LON is required', req.lang) );

      const mDeliveryAddress = await App.getModel('DeliveryAddress').findOne({
        where: { id },
      });

      if( !App.isObject(mDeliveryAddress) )
        return await App.json( res, false, App.t('DeliveryAddress not found', req.lang) );

      const updateDeliveryAddress = await mDeliveryAddress.update({
        lat,
        lon,
      });

      if( !App.isObject(updateDeliveryAddress) )
        return await App.json( res, false, App.t('Faile to update DeliveryAddress', req.lang) );

      await App.json( res, true, App.t('success', req.lang) );

    }catch(e){
      console.log(e);
      App.onRouteError( req, res, e );
      // App.json( res, false, App.t('request-could-not-be-processed', req.lang) );
    }

  });

  return { router, method: '', autoDoc:{} };

};
