const express = require('express');
const router = express.Router();


// {
//   "id": "required: <number> Ref. DeliveryAddresses.id"
// }


// /private/client/delivery-addresses/set/default/by/id/:id

module.exports = function(App, RPath){

  router.use('', async(req, res)=>{

    try{

      const mUser = await req.user;
      const mClient = await req.client;
      const data = req.getPost();

      const id = req.getCommonDataInt('id', null);
      if( App.isNull(id) )
        return App.json( res, 417, App.t(['delivery','address','id','is-required'], res.lang));

      // console.debug({DeliveryAddress: {id}});
      const mDeliveryAddress = await App.getModel('DeliveryAddress').findOne({
        where: {
          id,
          clientId: mClient.id,
          isOneTimeAddress: false,
          // isDefault: false,
        }
      });

      if( !App.isObject(mDeliveryAddress) || !App.isPosNumber(mDeliveryAddress.id) )
        return App.json( res, 404, App.t(['delivery','address','not','found'], res.lang) );

      await App.getModel('DeliveryAddress').update(
        { isDefault: false },
        { where: { clientId: mClient.id } }
      );

      const updateRes = await mDeliveryAddress.update({ isDefault: true });
      if( !App.isObject(updateRes) || !App.isPosNumber(updateRes.id) )
        return App.json( res, false, App.t(['failed-to','update','delivery','addresses'], res.lang) );

      App.json( res, true, App.t(['success'], res.lang) );

    }catch(e){
      console.log(e);
      App.onRouteError( req, res, e );
      // App.json( res, false, App.t('request-could-not-be-processed', req.lang) );
    }

  });

  return { router, method: '', autoDoc:{} };

};


