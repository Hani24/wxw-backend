const express = require('express');
const router = express.Router();

// {
//   "id": "required: <number>: Ref. Restaurant.id"
// }

// /private/admin/restaurants/requests/decline/by/id/:id

module.exports = function(App, RPath){

  router.use('', async(req, res)=>{

    try{

      const mUser = await req.user;
      // const mRestaurant = await req.restaurant;

      const roles = App.getModel('User').getRoles();
      const id = App.getPosNumber(req.getCommonDataInt('id', null));

     if( App.isNull(id) )
        return App.json( res, 417, App.t(['Restaurant id is required'], req.lang) );

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
            // isRestricted: false,
          },
          attributes: [
            'id','email','phone','firstName','lastName'
          ],
        }],
      });

      if( !App.isObject(mRestaurant) || !App.isPosNumber(mRestaurant.id) )
        return App.json( res, 404, App.t(['Restaurant not found'], req.lang) );

      if( !mRestaurant.isValidChecksum )
        return App.json( res, 403, App.t(['Restaurant Security check error'], req.lang) );

      if( mRestaurant.isVerified )
        return App.json( res, 417, App.t(['Restaurant already verified'], req.lang) );

      if( mRestaurant.isRestricted )
        return App.json( res, 417, App.t(['Restaurant is restricted'], req.lang) );

      if( mRestaurant.User.isRestricted )
        return App.json( res, 417, App.t(['Restaurant owner is restricted'], req.lang) );

      const tx = await App.DB.sequelize.transaction( App.DB.getTxOptions() );

      try{

        const updateRestaurant = await mRestaurant.update({
          // isDeleted: true,
          // deletedAt: App.getISODate(),
          isRestricted: true,
          restrictedAt: App.getISODate(),
          checksum: true,
        }, {transaction: tx});

        if( !App.isObject(updateRestaurant) || !App.isPosNumber(updateRestaurant.id) ){
          await tx.rollback();
          return App.json( res, false, App.t(['Failed to update restaurant'], req.lang) );
        }

        const updateUser = await mRestaurant.User.update({
          // isDeleted: true,
          // deletedAt: App.getISODate(),
          isRestricted: true,
          restrictedAt: App.getISODate(),
        }, {transaction: tx});

        if( !App.isObject(updateUser) || !App.isPosNumber(updateUser.id) ){
          await tx.rollback();
          return App.json( res, false, App.t(['Failed to update user'], req.lang) );
        }

        await tx.commit();

      }catch(e){
        console.error(e.message);
        await tx.rollback();
        return App.json( res, false, App.t(['Failed to decline request'], req.lang) );
      }

      await App.json( res, true, App.t(['Restaurant successfully declined'], res.lang));

      // [post-processing]

      {
        const declineRequestEmeil = await App.Mailer.send({
          to: mRestaurant.User.email,
          subject: App.t(['restaurant-account-verification-declined'], req.lang),
          data: await App.Mailer.createEmailTemplate('restaurant-account-verification-declined', { 
            lang: 'en',
            firstName: mRestaurant.User.firstName,
            lastName: mRestaurant.User.lastName,
          })
        });
        
        if( !declineRequestEmeil.success ){
          console.error(`declineRequestEmeil: ${declineRequestEmeil.message}`);
          console.json({declineRequestEmeil});
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


