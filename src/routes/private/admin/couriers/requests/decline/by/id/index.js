const express = require('express');
const router = express.Router();

// {
//   "id": "required: <number>: Ref. Courier.id"
// }

// /private/admin/couriers/requests/decline/by/id/:id

module.exports = function(App, RPath){

  router.use('', async(req, res)=>{

    try{

      const mUser = await req.user;
      // const mRestaurant = await req.restaurant;

      const roles = App.getModel('User').getRoles();
      const id = App.getPosNumber(req.getCommonDataInt('id', null));

     if( App.isNull(id) )
        return App.json( res, 417, App.t(['user','id','is-required'], req.lang) );

      const mCourier = await App.getModel('Courier').findOne({
        where: {
          id,
          isDeleted: false,
          // isVerified: false,
          // isRequestSent: true,
          isRestricted: false,
        },
        distinct: true,
        attributes: [
          'id',
          'userId',
          'isOnline','lat','lon',
          'isVerified', 'verifiedAt',
          'isRestricted', 'restrictedAt',
          'isRequestSent', 'requestSentAt',
          'lastOnlineAt',
          'hasActiveOrder', 'activeOrderAt',
          'activeOrderId',
          'balance',
          'createdAt',
          'totalIncome','totalOrders','totalAcceptedOrders','totalRejectedOrders',
          'totalCanceledOrders','totalRating',
          'isValidChecksum','checksum',
          ...App.getModel('Courier').getChecksumKeys(),
        ],
        include: [{
          model: App.getModel('User'),
          required: true,
          where: {
            isDeleted: false,
            isRestricted: false,
            isEmailVerified: true,
          },
          attributes: [
            'id','email','phone','image','firstName','lastName', // 'fullName',
            'street','cityId',
            // 'isEmailVerified',
            // 'isPhoneVerified',
            'isRestricted',
            'lang',
            'gender',
            'createdAt',
          ],
          include: [{
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
        return App.json( res, 404, App.t(['courier','not-found'], req.lang) );

      if( mCourier.isVerified )
        return App.json( res, 417, App.t(['courier','already','verified'], req.lang) );

      if( !mCourier.isRequestSent )
        return App.json( res, 417, App.t(['courier','does-not','have','sent','yes','verification','request'], req.lang) );

      const tx = await App.DB.sequelize.transaction( App.DB.getTxOptions() );

      try{

        const updateCourier = await mCourier.update({
          // isDeleted: true,
          // deletedAt: App.getISODate(),
          isRestricted: true,
          restrictedAt: App.getISODate(),
          checksum: true,
        }, {transaction: tx});

        if( !App.isObject(updateCourier) || !App.isPosNumber(updateCourier.id) ){
          await tx.rollback();
          return App.json( res, false, App.t(['failed-to','update','courier'], req.lang) );
        }

        const updateUser = await mCourier.User.update({
          // isDeleted: true,
          // deletedAt: App.getISODate(),
          isRestricted: true,
          restrictedAt: App.getISODate(),
        }, {transaction: tx});

        if( !App.isObject(updateUser) || !App.isPosNumber(updateUser.id) ){
          await tx.rollback();
          return App.json( res, false, App.t(['failed-to','update','user'], req.lang) );
        }

        await tx.commit();

      }catch(e){
        console.error(e.message);
        await tx.rollback();
        return App.json( res, false, App.t(['failed-to','decline','request'], req.lang) );
      }

      await App.json( res, true, App.t(['courier','successfully','declined'], res.lang));
      // [post-processing]

      {
        const pushToCourierRes = await App.getModel('CourierNotification')
          .pushToCourier( mCourier, {
            type: App.getModel('CourierNotification').getTypes()['courierRequestRejected'],
            title: App.t(['account','verification'], req.lang),
            // message: App.t(['courier-account-verification-declined'], res.lang),
            message: App.t([`We regret to inform you that your ${App.getEnv('APP_NAME')} driver application was rejected.`], res.lang),
          });
        if( !pushToCourierRes.success ){
          console.error('pushToCourierRes');
          console.json({pushToCourierRes});
        }        
      }

      {
        const courierVeriedEmailRes = await App.Mailer.send({
          to: mCourier.User.email,
          subject: App.t(['courier-account-verification-declined'], req.lang),
          data: await App.Mailer.createEmailTemplate('courier-account-verification-declined', { 
            lang: 'en',
            firstName: mCourier.User.firstName,
            lastName: mCourier.User.lastName,
          })
        });
        
        if( !courierVeriedEmailRes.success ){
          console.json({courierVeriedEmailRes});
        }
      }

    }catch(e){
      console.log(e);
      App.onRouteError( req, res, e );
      // App.json( res, false, App.t('request-could-not-be-processed', req.lang) );
    }

  });

  return { router, method: '', autoDoc:{} };

};


