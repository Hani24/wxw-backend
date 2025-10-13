const express = require('express');
const router = express.Router();

// {
//   "id": "required: <number>: Ref. Restaurant.id"
// }

// /private/admin/restaurants/requests/accept/by/id/:id

// update Restaurants set isVerified=0 where id=4;
// select 
//   C.userId, U.email, U.role, U.isRestricted as u_isRestricted, U.isDeleted as u_isDeleted,
//   C.id, C.isVerified, C.isRestricted, C.isDeleted
// from  Couriers as C
// inner join Users as U
// on C.userId = U.id;
// -- where C.isRestricted = 0 and C.isVerified=1 and U.isRestricted=0;

// select 
//   R.userId, U.isRestricted as u_isRestricted, U.isDeleted as u_isDeleted,
//   R.id, R.name, R.isVerified, R.isRestricted, R.isDeleted
// from  Restaurants as R
// inner join Users as U
// on R.userId = U.id;

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
          // isRestricted: false,
        },
        distinct: true,
        attributes: [
          'id',
          'isVerified', 'verifiedAt',
          'isRestricted', 'restrictedAt',
          'isValidChecksum','checksum',
          ...App.getModel('Restaurant').getChecksumKeys(),
        ],
        include: [{
          required: true,
          model: App.getModel('User'),
          where: {
            role: roles.restaurant,
            isDeleted: false,
            isRestricted: false,
          },
          attributes: [
            'id','email','phone','firstName','lastName'
          ],
        }],
      });

      if( !App.isObject(mRestaurant) || !App.isPosNumber(mRestaurant.id) )
        return App.json( res, 404, App.t(['Restaurant','not-found'], req.lang) );

      if( !mRestaurant.isValidChecksum )
        return App.json( res, 403, App.t(['Restaurant Security check error'], req.lang) );

      if( mRestaurant.isVerified )
        return App.json( res, true, App.t(['Restaurant','already','verified'], req.lang) );

      // Allow to verify without KYC
      // if( !mRestaurant.isKycCompleted )
      //   return App.json( res, true, App.t(['The restaurant has not yet passed the KYC procedure'], req.lang) );

      if( mRestaurant.isRestricted )
        return App.json( res, 417, App.t(['Restaurant','is-restricted'], req.lang) );

      if( mRestaurant.User.isRestricted )
        return App.json( res, 417, App.t(['Restaurant','owner','is-restricted'], req.lang) );

      const updateRestaurant = await mRestaurant.update({
        isVerified: true,
        verifiedAt: App.getISODate(),
      });

      if( !App.isObject(updateRestaurant) || !App.isPosNumber(updateRestaurant.id) )
        return App.json( res, false, App.t(['Failed to','update','restaurant'], req.lang) );

      await mRestaurant.update({ checksum: true });

      await App.json( res, true, App.t(['Restaurant','successfully','verified'], res.lang));

      // [post-processing]

      const acceptRequestEmeil = await App.Mailer.send({
        to: mRestaurant.User.email,
        subject: App.t(['restaurant-account-verification-accepted'], req.lang),
        data: await App.Mailer.createEmailTemplate('restaurant-account-verification-accepted', { 
          lang: 'en',
          firstName: mRestaurant.User.firstName,
          lastName: mRestaurant.User.lastName,
        })
      });
      
      if( !acceptRequestEmeil.success ){
        console.error(`acceptRequestEmeil: ${acceptRequestEmeil.message}`);
        console.json({acceptRequestEmeil});
      }

    }catch(e){
      console.log(e);
      App.onRouteError( req, res, e );
      // App.json( res, false, App.t('request-could-not-be-processed', req.lang) );
    }

  });

  return { router, method: '', autoDoc:{} };

};


