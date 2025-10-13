const express = require('express');
const router = express.Router();
//   "stateId": "optional: <number> Ref. State.id",

// {
//   "cityId": "optional: <number> Ref. City.id",
//   "street": "optional: <string>",
//   "name": "optional: <string>",
//   "description": "optional: <string>",
//   "type": "optional: <string>",
//   "email": "optional: <string>",
//   "phone": "optional: <string>",
//   "website": "optional: <string>",
//   "orderPrepTime": "optional: <number>"
// }

//   "stateId": 6,

// {
//   "cityId": 768,
//   "street": "24 Walnut Street",
//   "name": "Super-Resto",
//   "description": "some short info",
//   "type": "stationary",
//   "email": "test@Super-Resto.com",
//   "phone": "+32498403994",
//   "website": "https://super-resto.com",
//   "orderPrepTime": 45
// }

// /routes/private/restaurant/info/update/

module.exports = function(App, RPath){

  router.use('', async(req, res)=>{

    try{

      const data = req.getPost();
      const mUser = await req.user;
      const mRestaurant = await req.restaurant;

      const restoTypes = App.getModel('Restaurant').getTypes({asArray: false});

      const info_t = {
        cityId: req.getCommonDataInt('cityId', mRestaurant.cityId),
        street: req.getCommonDataString('street', mRestaurant.street),
        // zip: req.getCommonDataInt('zip', mRestaurant.zip),
        name: req.getCommonDataString('name', mRestaurant.name).trim(),
        description: req.getCommonDataString('description', mRestaurant.description),
        type: req.getCommonDataString('type', mRestaurant.type),
        // email: App.tools.normalizeEmail( req.getCommonDataString('email', mRestaurant.email).trim() ),
        // phone: App.tools.cleanPhone( req.getCommonDataString('phone', mRestaurant.phone).trim() ),
        website: req.getCommonDataString('website', mRestaurant.website).trim(),
        orderPrepTime: req.getCommonDataInt('orderPrepTime', mRestaurant.orderPrepTime),
        // lat: req.getCommonDataFloat('lat', mRestaurant.lat),
        // lon: req.getCommonDataFloat('lon', mRestaurant.lon),
        // isOpen: req.getCommonDataInt('isOpen', mRestaurant.isOpen),
      };

      const mCity = await App.getModel('City').findOne({
        where: {
          id: info_t.cityId, 
        },
        include: [{
          model: App.getModel('State'),
        }],
      });

      if( !App.isObject(mCity) || !App.isPosNumber(mCity.id) )
        return App.json(res, 404, App.t(['city','not-found'], req.lang) );

      if( !App.isObject(mCity.State) || !App.isPosNumber(mCity.State.id) )
        return App.json(res, 404, App.t(['state','not-found'], req.lang) );

      if( !info_t.name )
        return App.json(res, 417, App.t(['name','is-required'], req.lang) );

      if( !info_t.description )
        return App.json(res, 417, App.t(['description','is-required'], req.lang) );

      if( !restoTypes.hasOwnProperty(info_t.type) )
        return App.json(res, 417, App.t(['restaurant','type','is-required'], req.lang));

      if( info_t.orderPrepTime > 60 ) info_t.orderPrepTime = 60;
      if( info_t.orderPrepTime < 0 ) info_t.orderPrepTime = 0;

      const email = App.tools.normalizeEmail( req.getCommonDataString('email', '' /*mRestaurant.email*/).trim() );
      if( App.tools.isValidEmail( email ) ){
        // return App.json(res, 417, App.t(['email','address','is-not','valid'], req.lang));
        info_t.email = email;
      }

      const phone = App.tools.cleanPhone( req.getCommonDataString('phone', '', /*mRestaurant.phone*/).trim() );
      if( App.tools.isValidPhone(phone) ){
        // return App.json(res, 417, App.t(['phone','number','is-not','valid'], req.lang));
        info_t.phone = phone;
      }

      const geoRes = await App.geo.tools.getCoordsFromAddress({
        state: mCity.State.name, 
        city: mCity.name, 
        street: info_t.street,
      });

      if( !geoRes.success ){
        console.json({geoRes});
        return App.json(res, 417, App.t(geoRes.message, req.lang));
      }

      info_t.lat = geoRes.data.lat;
      info_t.lon = geoRes.data.lon;

      const updateRes = await mRestaurant.update( info_t );
      if( !App.isObject(updateRes) )
        return App.json(res, 417, App.t(['failed-to','update','image'], req.lang) );

      App.json(res, true, App.t(['success'],req.lang), updateRes);

    }catch(e){
      console.log(e);
      App.onRouteError( req, res, e );
      // App.json( res, false, App.t('request-could-not-be-processed', req.lang) );
    }

  });

  return { router, method: 'POST', autoDoc:{} };

};


