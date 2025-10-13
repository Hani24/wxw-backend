const express = require('express');
const router = express.Router();

// {
//   "id": "required: <number>: Ref. Restaurant.id"
// }

// {
//   "id": 2
// }

// /private/admin/restaurants/admin-access/by/restaurant/id/:id

module.exports = function(App, RPath){

  router.use('', async(req, res)=>{

    try{

      const data = req.getPost();
      const mUser = await req.user; // admin
      // const mRestaurant = await req.restaurant;
      const roles = App.getModel('User').getRoles();

      const id = App.getPosNumber(req.getCommonDataInt('id', null));

      if( App.isNull(id) )
        return App.json( res, 417, App.t(['restaurant','id','is-required'], req.lang) );

      const mRestaurant = await App.getModel('Restaurant').findOne({
        where: {
          id,
          isDeleted: false,
        },
        attributes: ['id','name','isVerified','isRestricted']
      });

      if( !App.isObject(mRestaurant) || !App.isPosNumber(mRestaurant.id) )
        return App.json(res, 404, App.t(['restaurant','id',id, 'not-found'], req.lang));

      const updateAdminUser = await mUser.update({
        restaurantId: id,
      });

      if( !App.isObject(updateAdminUser) || !App.isPosNumber(updateAdminUser.id) ){
        console.error(App.t(['failed-to','set','default','restaurant','access'], req.lang));
        console.json({mRestaurant});
        return App.json(res, false, App.t(['failed-to','set','default','restaurant',`${mRestaurant.id}:${mRestaurant.name}`,'access'], req.lang));
      }
	   console.dir(res.data, { depth: 2 });

      App.json( res, true, App.t(['restaurant',`${mRestaurant.id}:${mRestaurant.name}`,'has-been','set','as','default','to','access'], res.lang), mRestaurant);

    }catch(e){
      console.log(e);
      App.onRouteError( req, res, e );
      // App.json( res, false, App.t('request-could-not-be-processed', req.lang) );
    }

  });

  return { router, method: '', autoDoc:{} };

};

