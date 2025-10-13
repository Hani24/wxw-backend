const express = require('express');
const router = express.Router();

// {
//   "id": "required: <number> Ref. DeliveryAddresses.id"
// }

// {
//   "id": 1
// }

// /private/client/delivery-addresses/get/by/id/:id

module.exports = function(App, RPath){

  router.use('', async(req, res)=>{

    try{

      const mUser = await req.user;
      const mClient = await req.client;
      const data = req.getPost();

      const id = req.getCommonDataInt('id', null);
      if( App.isNull(id) )
        return App.json( res, 417, App.t(['Delivery-Address','id','is-required'], res.lang));

      const mDeliveryAddress = await App.getModel('DeliveryAddress').findOne({
        where: {
          id,
          clientId: mClient.id,
          isOneTimeAddress: false,
          isDefault: false,
        },
        attributes: {
          exclude: ['clientId','createdAt']
        },
        include:[
          // {
          //   model: App.getModel('City'),
          //   attributes:['id','name'],
          //   required: true,
          //   include:[{
          //     model: App.getModel('State'),
          //     attributes:['id','name','code'],
          //   }],
          // },
          {
            model: App.getModel('State'),
            attributes: ['id','name','code'],
            required: true,
          },
        ],
      });

      if( !App.isObject(mDeliveryAddress) || !App.isPosNumber(mDeliveryAddress.id) )
        return App.json( res, 404, App.t(['Delivery-Address','not','found'], res.lang) );

      App.json( res, true, App.t('success', res.lang), mDeliveryAddress );

    }catch(e){
      console.log(e);
      App.onRouteError( req, res, e );
      // App.json( res, false, App.t('request-could-not-be-processed', req.lang) );
    }

  });

  return { router, method: '', autoDoc:{} };

};


