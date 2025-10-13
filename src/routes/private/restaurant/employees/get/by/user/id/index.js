const express = require('express');
const router = express.Router();

// {
//   "userId": "required: <number>: Ref. User.id"
// }

// /private/restaurant/employees/get/by/user/id/:id

module.exports = function(App, RPath){

  router.use('', async(req, res)=>{

    try{

      const data = req.getPost();
      // const mUser = await req.user;
      const mRestaurant = await req.restaurant;
      const roles = App.getModel('User').getRoles();

      const userId = App.getPosNumber(req.getCommonDataInt('userId', null));

     if( App.isNull(userId) )
        return App.json( res, 417, App.t(['user','id','is-required'], req.lang) );

      const mRestoUser = await App.getModel('User').findOne({
        where: {
          id: userId,
          restaurantId: mRestaurant.id,
          isDeleted: false,
          role: { [ App.DB.Op.in ]: [ roles.manager, roles.employee ] },
        }
      });

      if( !App.isObject(mRestoUser) || !App.isPosNumber(mRestoUser.id) )
        return App.json( res, 404, App.t(['employee','not-found','and/or','does-not','belong','to','restaurant'], req.lang) );

      const mManager = ((mRestoUser.role === roles.manager) ? (await App.getModel('Manager').getByFields({userId})) : null);
      const mEmployee = ((mRestoUser.role === roles.employee) ? (await App.getModel('Employee').getByFields({userId})) : null);

      App.json( res, true, App.t('success', res.lang), {
        user: await App.getModel('User').getCommonDataFromObject(mRestoUser),
        manager: mManager,
        employee: mEmployee,
      });

    }catch(e){
      console.log(e);
      App.onRouteError( req, res, e );
      // App.json( res, false, App.t('request-could-not-be-processed', req.lang) );
    }

  });

  return { router, method: 'POST', autoDoc:{} };

};


