const express = require('express');
const router = express.Router();

// {
//   "id": "required: <number>: Ref. Courier.id"
// }

// /private/admin/couriers/get/by/id

module.exports = function(App, RPath){

  router.use('', async(req, res)=>{

    try{

      const mUser = await req.user;
      // const mRestaurant = await req.restaurant;

      const roles = App.getModel('User').getRoles();
      const id = App.getPosNumber(req.getCommonDataInt('id', null));

     if( App.isNull(id) )
        return App.json( res, 417, App.t(['courier','id','is-required'], req.lang) );

      const mCourier = await App.getModel('Courier').findOne({
        where: {
          id,
          isDeleted: false,
          // isRestricted: false,
          // isVerified: true,
          // isRequestSent: true,
        },
        distinct: true,
        attributes: [
          'id',
          'isOnline','lat','lon',
          'isVerified', 'verifiedAt',
          'isRestricted', 'restrictedAt',
          'lastOnlineAt',
          'hasActiveOrder', 'activeOrderAt',
          'activeOrderId',
          'balance',
          'totalIncome','totalOrders','totalAcceptedOrders','totalRejectedOrders',
          'totalCanceledOrders',
          'totalRating',
          'createdAt',
          'isKycCompleted',
        ],
        include: [{
          model: App.getModel('User'),
          required: true,
          where: {
            isDeleted: false,
            role: roles.courier,
          },
          attributes: [
            'id','email','phone','image','firstName','lastName','fullName','birthday',
            'lang','gender',
            'street','cityId',
            'isEmailVerified',
            'isPhoneVerified',
            'isRestricted',
            'createdAt',
          ],
          include: [{
            required: false,
            model: App.getModel('City'),
            attributes: ['id','name','stateId'],
            include: [{
              model: App.getModel('State'),
              attributes: ['id','name'],
            }]
          }]
        }],
      });

      if( !App.isObject(mCourier) || !App.isPosNumber(mCourier.id) )
        return App.json( res, 404, App.t(['courier','not-found','or','has','switched-to','client','account'], req.lang) );

      if( mCourier.isRestricted || mCourier.User.isRestricted )
        return App.json( res, 404, App.t(['courier','has-been','restricted'], req.lang) );

      App.json( res, true, App.t('success', res.lang), mCourier);

    }catch(e){
      console.log(e);
      App.onRouteError( req, res, e );
      // App.json( res, false, App.t('request-could-not-be-processed', req.lang) );
    }

  });

  return { router, method: '', autoDoc:{} };

};


