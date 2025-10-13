const express = require('express');
const router = express.Router();

// {
//   "id": "required: <number>: Ref. Client.id"
// }

// /private/admin/clients/get/by/id

module.exports = function(App, RPath){

  router.use('', async(req, res)=>{

    try{

      const mUser = await req.user;
      // const mRestaurant = await req.restaurant;

      const roles = App.getModel('User').getRoles();
      const id = App.getPosNumber(req.getCommonDataInt('id', null));

     if( App.isNull(id) )
        return App.json( res, 417, App.t(['user','id','is-required'], req.lang) );

      const mClient = await App.getModel('Client').findOne({
        where: {
          id,
          isDeleted: false,
          // isVerified: true,
          // isRequestSent: true,
          // isRestricted: false,
        },
        distinct: true,
        attributes: [
          'id',
          'lat','lon',
          // 'isVerified', 'verifiedAt',
          'isRestricted', 'restrictedAt',
          'totalSpend',
          'totalOrders',
          'totalRejectedOrders',
          'totalCanceledOrders',
          'totalCompletedOrders',
          'createdAt',
        ],
        include: [{
          model: App.getModel('User'),
          required: true,
          where: {
            isDeleted: false,
            // isRestricted: false,
            // isEmailVerified: true,
            // isPhoneVerified: true,
            role: roles.client,
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

      if( !App.isObject(mClient) || !App.isPosNumber(mClient.id) )
        return App.json( res, 404, App.t(['client','not-found','or','has','switched-to','courier','account'], req.lang) );

      if( mClient.isRestricted || mClient.User.isRestricted )
        return App.json( res, 404, App.t(['client','has-been','restricted'], req.lang) );

      mClient.dataValues.totalFavorites 
        = await App.getModel('FavoriteMenuItem')
          .getTotalWhere({clientId: mClient.id});

      App.json( res, true, App.t('success', res.lang), mClient);

    }catch(e){
      console.log(e);
      App.onRouteError( req, res, e );
      // App.json( res, false, App.t('request-could-not-be-processed', req.lang) );
    }

  });

  return { router, method: '', autoDoc:{} };

};


