const express = require('express');
const router = express.Router();

// {
//   "label": "required: <string>",
//   "stateId": "required: <number>: Ref. State.id",
//   "city": "required: <string>",
//   "street": "required: <string>",
//   "isOneTimeAddress": "required: <boolean> if true: address will exists only for [this] order"
//   "apartment": "optional: <string>",
//   "description": "optional: <string>",
// }

// "24, Walnut Avenue, Mill Valley, Marin County, California, 94941, United States"
// {
//   "label": "Home",
//   "stateId": 6,
//   "city": "Mill Valley",
//   "street": "24 Walnut Ave",
//   "apartment": "23",
//   "description": "some extra client notes...",
//   "isOneTimeAddress": false
// }

// /private/client/delivery-addresses/add

module.exports = function(App, RPath){

  router.use('', async(req, res)=>{

    try{

      const mUser = await req.user;
      const mClient = await req.client;
      const data = req.getPost();

      // const cityId = req.getCommonDataInt('cityId', null);
      // if( App.isNull(cityId) )
      //   return App.json( res, 417, App.t(['City','id','is-required'], res.lang));

      // if( !(await App.getModel('City').isset({id: cityId})) )
      //   return App.json( res, 404, App.t(['City','id','not','found'], res.lang));

      // [required]
      const deliveryAddress_t = {
        clientId: mClient.id,
        // cityId,
        stateId: req.getCommonDataInt('stateId', null),
        isDefault: true,
        label: req.getCommonDataString('label', 'no-name'),
        city: req.getCommonDataString('city', null),
        street: req.getCommonDataString('street', null),
        apartment: req.getCommonDataString('apartment', '').substr(0, 128),
        description: req.getCommonDataString('description', '').substr(0,1024),
        isOneTimeAddress: App.getBoolFromValue(data.isOneTimeAddress),
      };

      if( !deliveryAddress_t.stateId )
        return App.json( res, 417, App.t(['state','is-required'], res.lang) );

      const mState = await App.getModel('State').getByFields({id: deliveryAddress_t.stateId});

      if( !App.isObject(mState) || !App.isPosNumber(mState.id) )
        return App.json( res, 417, App.t(['state','not-found'], res.lang) );

      if( !deliveryAddress_t.city )
        return App.json( res, 417, App.t(['city','is-required'], res.lang) );

      if( !deliveryAddress_t.street )
        return App.json( res, 417, App.t(['street','is-required'], res.lang) );

      // for ( const mKey of Object.keys(deliveryAddress_t) ){
      //   if( App.isNull(deliveryAddress_t[ mKey ]) )
      //     return App.json( res, 417, App.t([`${ mKey }`,'is-required'], res.lang) );
      // }

      deliveryAddress_t.isDefault = deliveryAddress_t.isOneTimeAddress ? false : deliveryAddress_t.isDefault;
      deliveryAddress_t.label = deliveryAddress_t.isOneTimeAddress ? 'tmp-address' : deliveryAddress_t.label.substr(0, 64);
      deliveryAddress_t.city = deliveryAddress_t.city.substr(0, 128);
      deliveryAddress_t.street = deliveryAddress_t.street.substr(0, 128);

      deliveryAddress_t.lat = 0;
      deliveryAddress_t.lon = 0;

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

      if( deliveryAddress_t.isDefault ){
        await App.getModel('DeliveryAddress').update(
          { isDefault: false },
          { where: { clientId: mClient.id } }
        );
      }

      const mDeliveryAddress = await App.getModel('DeliveryAddress').create( deliveryAddress_t );
      if( !App.isObject(mDeliveryAddress) || !App.isPosNumber(mDeliveryAddress.id) ){
        console.json({deliveryAddress_t});
        return App.json( res, false, App.t(['failed-to','create','Delivery-Address'], res.lang) );
      }

      App.json( res, true, App.t('success', res.lang), mDeliveryAddress );

    }catch(e){
      console.log(e);
      App.onRouteError( req, res, e );
      // App.json( res, false, App.t('request-could-not-be-processed', req.lang) );
    }

  });

  return { router, method: '', autoDoc:{} };

};


