const express = require('express');
const router = express.Router();

// {
//   "id": "required: <number>: Ref. courier.id"
// }

// /private/admin/couriers/delete/by/id/

module.exports = function(App, RPath){

  router.use('', async(req, res)=>{

    try{

      const data = req.getPost();
      // const mUser = await req.user; // restaurant-owner
      const mRestaurant = await req.restaurant;
      const roles = App.getModel('User').getRoles();

      const id = req.getCommonDataInt('id', null);

      if( App.isNull(id) )
        return App.json( res, 417, App.t(['user','id','is-required'], req.lang) );

      const mCourier = await App.getModel('Courier').findOne({
        where: {
          id: id,
          isDeleted: false,          
          isRestricted: false,          
        },
        attributes: [
          'id',
          'isDeleted',
          'deletedAt',
          'isRestricted',
          'restrictedAt',
          'isValidChecksum','checksum',
          ...App.getModel('Courier').getChecksumKeys(),
        ],
        include: [{
          required: true,
          model: App.getModel('User'),
          attributes: [
            'id',
	    'email',
	    'phone',
            'isDeleted',
            'deletedAt',
            'isRestricted',
            'restrictedAt',
          ]
        }]
      });
      if( !App.isObject(mCourier) || !App.isPosNumber(mCourier.id) )
        return App.json( res, 404, App.t(['courier','not-found'], req.lang) );

      if( mCourier.hasActiveOrder || App.isPosNumber(mCourier.activeOrderId) )
        return App.json( res, 417, App.t(['courier','has','active','order','at-the','moment'], req.lang) );

      const tx = await App.DB.sequelize.transaction( App.DB.getTxOptions() );

      try{

        const updateCourier = await mCourier.update({
          // isDeleted: true,
          // deletedAt: App.getISODate(),
          isRestricted: true,
          restrictedAt: App.getISODate(),
          checksum: true
        });

        if( !App.isObject(updateCourier) || !App.isPosNumber(updateCourier.id) ){
          await tx.rollback();
          return App.json(res, false, App.t(['failed-to','update','courier'], req.lang));
        }

        const updateUser = await mCourier.User.update({
          // isDeleted: true,
          // deletedAt: App.getISODate(),
          isRestricted: true,
          restrictedAt: App.getISODate(),
	 email: `deleted ${mCourier.User.id} ${mCourier.User.email}`,
          phone: `deleted ${mCourier.User.id} ${mCourier.User.phone}`,
        });

        if( !App.isObject(updateUser) || !App.isPosNumber(updateUser.id) ){
          await tx.rollback();
          return App.json( res, false, App.t(['failed-to','update','user'], req.lang) );
        }

        await tx.commit();

      }catch(e){
        console.error(e.message);
        await tx.rollback();
        return App.json( res, false, App.t(['failed-to','update'], req.lang) );
      }

      await App.json( res, true, App.t(['courier','successfully','restricted'], res.lang));

    }catch(e){
      console.log(e);
      App.onRouteError( req, res, e );
      // App.json( res, false, App.t('request-could-not-be-processed', req.lang) );
    }

  });

  return { router, method: '', autoDoc:{} };

};


