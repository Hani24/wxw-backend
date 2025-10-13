const express = require('express');
const router = express.Router();


// {
//   "id": "required: <number> Ref. DeliveryAddresses.id",
//   "label": "required: <string>",
//   "stateId": "required: <number>: Ref. State.id",
//   "city": "required: <string>",
//   "street": "required: <string>",
//   "apartment": "required: <string>",
//   "description": "required: <string>"
// }

// 24 Walnut Ave, Mill Valley, CA 94941
// "24, Walnut Avenue, Mill Valley, Marin County, California, 94941, United States"
// {
//   "label": "Home",
//   "stateId": 6,
//   "city": "Mill Valley",
//   "street": "24 Walnut Ave",
//   "apartment": "23",
//   "description": "some extra client notes..."
// }

// /private/client/delivery-addresses/update/by/id/:id

module.exports = function(App, RPath){

  router.use('', async(req, res)=>{

    try{

      const mUser = await req.user;
      const mClient = await req.client;
      const data = req.getPost();

      const id = req.getCommonDataInt('id', null);
      if( !App.isPosNumber(id) )
        return App.json( res, 417, App.t(['delivery','address','id','is-required'], res.lang));

      const mDeliveryAddress = await App.getModel('DeliveryAddress').findOne({
        where: {
          id,
          clientId: mClient.id,
          isOneTimeAddress: false,
          isDefault: false,
        }
      });

      if( !App.isObject(mDeliveryAddress) || !App.isPosNumber(mDeliveryAddress.id) )
        return App.json( res, 404, App.t(['delivery','address','not','found'], res.lang) );

      const deliveryAddress_t = {
        // [all-optional]
        stateId: req.getCommonDataInt('stateId', mDeliveryAddress.stateId),
        city: req.getCommonDataString('city', mDeliveryAddress.city).substr(0, 128),
        label: req.getCommonDataString('label', mDeliveryAddress.label).substr(0, 64),
        street: req.getCommonDataString('street', mDeliveryAddress.street).substr(0, 128),
        apartment: req.getCommonDataString('apartment', mDeliveryAddress.apartment).substr(0, 128),
        description: req.getCommonDataString('description', mDeliveryAddress.description).substr(0,1024),
        lat: mDeliveryAddress.lat,
        lon: mDeliveryAddress.lon,
      };

      // for ( const mKey of Object.keys(deliveryAddress_t) ){
      //   if( !App.isString(deliveryAddress_t[ mKey ]) && !App.isPosNumber(deliveryAddress_t[ mKey ]) )
      //     return App.json( res, 417, App.t([`${ mKey }`,'is-required'], res.lang) );
      // }

      if( !deliveryAddress_t.stateId )
        return App.json( res, 417, App.t(['state','is-required'], res.lang) );

      const mState = await App.getModel('State').getByFields({id: deliveryAddress_t.stateId});

      if( !App.isObject(mState) || !App.isPosNumber(mState.id) )
        return App.json( res, 417, App.t(['state','not-found'], res.lang) );

      if( !deliveryAddress_t.city )
        return App.json( res, 417, App.t(['city','is-required'], res.lang) );

      if( !deliveryAddress_t.street )
        return App.json( res, 417, App.t(['street','is-required'], res.lang) );

      // deliveryAddress_t.isDefault = deliveryAddress_t.isOneTimeAddress ? false : deliveryAddress_t.isDefault;
      deliveryAddress_t.label = deliveryAddress_t.isOneTimeAddress ? 'tmp-address' : deliveryAddress_t.label.substr(0, 64);
      deliveryAddress_t.city = deliveryAddress_t.city.substr(0, 128);
      deliveryAddress_t.street = deliveryAddress_t.street.substr(0, 128);
      deliveryAddress_t.apartment = deliveryAddress_t.apartment.substr(0, 128);

      const coordsFromAddressRes = await App.geo.tools.getCoordsFromAddress({
        ...deliveryAddress_t,
        state: mState.name,
      });

      if( !coordsFromAddressRes.success ){
        console.json({ coordsFromAddressRes, deliveryAddress_t });
        return App.json( res, 417, App.t( coordsFromAddressRes.message , res.lang) );
      }

      deliveryAddress_t.lat = coordsFromAddressRes.data.lat;
      deliveryAddress_t.lon = coordsFromAddressRes.data.lon;


      // allow to set as [isDefault]
      // if( !App.isNull(req.getCommonDataString('isDefault', null)) ){
      //   deliveryAddress_t.isDefault = App.getBoolFromValue( req.getCommonDataString('isDefault', null) );
      //   await App.getModel('DeliveryAddress').update(
      //     {isDefault: false},
      //     { where: { clientId: mClient.id } }
      //   );
      // }

      const updateRes = await mDeliveryAddress.update( deliveryAddress_t );
      if( !App.isObject(updateRes) || !App.isPosNumber(updateRes.id) )
        return App.json( res, false, App.t(['failed-to','update','delivery','address'], res.lang) );

      App.json( res, true, App.t('success', res.lang), updateRes );

    }catch(e){
      console.log(e);
      App.onRouteError( req, res, e );
      // App.json( res, false, App.t('request-could-not-be-processed', req.lang) );
    }

  });

  return { router, method: '', autoDoc:{} };

};


