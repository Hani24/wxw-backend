const express = require('express');
const router = express.Router();

// /routes/private/restaurant/info/get/

module.exports = function(App, RPath){

  router.use('', async(req, res)=>{

    try{

      const data = req.getPost();
      const mUser = await req.user;
      const mRestaurant = await req.restaurant;

      const mCity = await App.getModel('City').findOne({
        where: {
          id: mRestaurant.cityId,
        },
        attributes: ['id','name'],
        include: [{
          required: true,
          model: App.getModel('State'),
          attributes: ['id','name'],
        }]
      });

      App.json(res, true, App.t(['success'],req.lang), {
        ...mRestaurant.toJSON(), 
        cityId: mCity.id,
        cityName: mCity.name,
        stateName: mCity.State.name,
        stateId: mCity.State.id,
      });

    }catch(e){
      console.log(e);
      App.onRouteError( req, res, e );
      // App.json( res, false, App.t('request-could-not-be-processed', req.lang) );
    }

  });

  return { router, method: 'POST', autoDoc:{} };

};


