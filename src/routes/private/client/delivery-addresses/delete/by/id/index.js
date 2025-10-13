const express = require('express');
const router = express.Router();

/*
{
  "id": "required: <number> Ref. DeliveryAddresses.id"
}

{
  "id": 1
}
*/

// /private/client/delivery-addresses/delete/by/id/:id

module.exports = function(App, RPath){

  router.use('', async(req, res)=>{

    try{

      const mUser = await req.user;
      const mClient = await req.client;
      const data = req.getPost();

      const id = req.getCommonDataInt('id', null);
      if( App.isNull(id) )
        return App.json( res, 417, App.t(['Delivery-Address','id','is-required'], res.lang));

      const mDeliveryAddress = await App.getModel('DeliveryAddress').getByFields({
        id,
        clientId: mClient.id,
        isOneTimeAddress: false,
        isDeleted: false,
      });

      if( !App.isObject(mDeliveryAddress) || !App.isPosNumber(mDeliveryAddress.id) )
        return App.json( res, 404, App.t(['Delivery-Address','not','found'], res.lang) );

      const deleteRes = await mDeliveryAddress.update({
        isDeleted: true,
        deletedAt: App.getISODate(),
      });

      if( !App.isObject(deleteRes) || !App.isPosNumber(deleteRes.id) )
        return App.json( res, false, App.t(['failed-to','delete','Delivery-Address'], res.lang) );

      if( mDeliveryAddress.isDefault ){

        // find next/latest added address && set it as default
        const mNextDeliveryAddress = await App.getModel('DeliveryAddress').findOne({
          where: {
            clientId: mClient.id,
            isOneTimeAddress: false,
            isDeleted: false,
          },
          order: [['id','desc']]
        });

        if( App.isObject(mNextDeliveryAddress) && App.isPosNumber(mNextDeliveryAddress.id) ){
          const updateNextAsDefault = await mNextDeliveryAddress.update({
            isDefault: true,
          });

          if( !App.isObject(updateNextAsDefault) || !App.isPosNumber(updateNextAsDefault.id) ){
            console.error('failed to update next delivery addresses ');
          }
        }

      }

      App.json( res, true, App.t('success', res.lang) );

    }catch(e){
      console.log(e);
      App.onRouteError( req, res, e );
      // App.json( res, false, App.t('request-could-not-be-processed', req.lang) );
    }

  });

  return { router, method: '', autoDoc:{} };

};


