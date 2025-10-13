const express = require('express');
const router = express.Router();

// {
//   "id": "required: <number>: Ref. Courier.id"
// }

// /private/admin/couriers/requests/accept/by/id/:id

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
          'id','userId',
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
          'isKycCompleted',
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
        return App.json( res, 417, App.t(['courier','does-not','have','sent','yet','verification','request'], req.lang) );

      if( !mCourier.isKycCompleted )
        return App.json(res, 417, App.t(['the courier must pass the KYC procedure first'], req.lang));

      const updateCourier = await mCourier.update({
        isVerified: true,
        verifiedAt: App.getISODate(),
        checksum: true,
      });

      if( !App.isObject(updateCourier) || !App.isPosNumber(updateCourier.id) )
        return App.json( res, false, App.t(['failed-to','update','courier'], req.lang) );

      await App.json( res, true, App.t(['courier','successfully','verified'], res.lang), updateCourier);

      // [post-processing]

      {
        const pushToCourierRes = await App.getModel('CourierNotification')
          .pushToCourier( mCourier, {
            type: App.getModel('CourierNotification').getTypes()['courierRequestApproved'],
            title: App.t(['courier-account-verification-accepted'], req.lang),
            // message: App.t(['login-to-start-working-today'], res.lang),
            message: App.t([
              `You ${App.getEnv('APP_NAME')} driver application was accepted! You can now go online to start receiving orders for the delivery.`
            ], res.lang),
          });
        if( !pushToCourierRes.success ){
          console.error('pushToCourierRes');
          console.json({pushToCourierRes});
        }        
      }

      {
        const courierVeriedEmailRes = await App.Mailer.send({
          to: mCourier.User.email,
          subject: App.t(['courier-account-verification-accepted'], req.lang),
          data: await App.Mailer.createEmailTemplate('courier-account-verification-accepted', { 
            lang: 'en',
            firstName: mCourier.User.firstName,
            lastName: mCourier.User.lastName,
          })
        });
        
        if( !courierVeriedEmailRes.success ){
          console.error(`courierVeriedEmailRes: ${courierVeriedEmailRes.message}`);
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


