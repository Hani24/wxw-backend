const express = require('express');
const router = express.Router();

// {
//   "id": "required: <number>: Ref. Restaurant.id"
// }

// /private/admin/restaurants/get/by/id

module.exports = function(App, RPath){

  router.use('', async(req, res)=>{

    try{

      const mUser = await req.user;
      // const mRestaurant = await req.restaurant;

      const roles = App.getModel('User').getRoles();
      const id = App.getPosNumber(req.getCommonDataInt('id', null));

     if( App.isNull(id) )
        return App.json( res, 417, App.t(['restaurant','id','is-required'], req.lang) );

      const mRestaurant = await App.getModel('Restaurant').findOne({
        where: {
          id,
          isDeleted: false,
          // isVerified: true,
          // isRequestSent: true,
          // isRestricted: false,
        },
        distinct: true,
        attributes: [
          'id','name','email','phone','website','orderPrepTime','description',
          'image','isOpen','lat','lon','isOpen','rating','type',
          'street','cityId','zip','comment',
          // [ App.DB.literal(`(abs(Restaurant.lat)-(${aLat}))`), 'aLat' ],
          // [ App.DB.literal(`(abs(Restaurant.lon)-(${aLon}))`), 'aLon' ],
          'isVerified', 'verifiedAt',
          'isRestricted', 'restrictedAt',
          'isKycCompleted',
          'totalOrders',
          'totalAcceptedOrders',
          'totalCanceledOrders',
          'totalIncomeInCent',
          'totalPreparationTimeInSeconds',
          'createdAt',
        ],
        include: [
          {
            required: true,
            model: App.getModel('City'),
            attributes: ['id','name','stateId'],
            include: [{
              model: App.getModel('State'),
              attributes: ['id','name'],
            }]
          },
          {
            model: App.getModel('User'),
            required: true,
            where: {
              isDeleted: false,
            },
            attributes: [
              'id','email','phone','image','firstName','lastName', // 'fullName',
              'street','cityId',
              'isEmailVerified',
              'isPhoneVerified',
              'isRestricted',
              'lang',
              'gender',
              'createdAt',
            ],
            // include: [{
            //   model: App.getModel('City'),
            //   attributes: ['id','name','stateId'],
            //   include: [{
            //     model: App.getModel('State'),
            //     attributes: ['id','name'],
            //   }]
            // }]
          }
        ],
      });

      if( !App.isObject(mRestaurant) || !App.isPosNumber(mRestaurant.id) )
        return App.json( res, 404, App.t(['restaurant','not-found'], req.lang) );

      App.json( res, true, App.t('success', res.lang), mRestaurant);

    }catch(e){
      console.log(e);
      App.onRouteError( req, res, e );
      // App.json( res, false, App.t('request-could-not-be-processed', req.lang) );
    }

  });

  return { router, method: '', autoDoc:{} };

};


