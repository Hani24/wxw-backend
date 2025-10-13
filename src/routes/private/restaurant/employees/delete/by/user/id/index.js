const express = require('express');
const router = express.Router();

// {
//   "userId": "required: <number>: Ref. User.id"
// }

// /private/restaurant/employees/delete/by/user/id/:id

module.exports = function(App, RPath){

  router.use('', async(req, res)=>{

    try{

      const data = req.getPost();
      // const mUser = await req.user; // restaurant-owner
      const mRestaurant = await req.restaurant;
      const roles = App.getModel('User').getRoles();

      const userId = req.getCommonDataInt('userId', null);

      if( App.isNull(userId) )
        return App.json( res, 417, App.t(['User id is required'], req.lang) );

      const mRestoUser = await App.getModel('User').getByFields({
        id: userId,
        restaurantId: mRestaurant.id,
        isDeleted: false,
        isRestricted: false,
        role: { [ App.DB.Op.in ]: [ roles.manager, roles.employee ] },
      });

      if( !App.isObject(mRestoUser) || !App.isPosNumber(mRestoUser.id) )
        return App.json( res, 404, App.t(['Employee not found and/or does not belong to restaurant'], req.lang) );

      const tx = await App.DB.sequelize.transaction( App.DB.getTxOptions() );
      let data_t = {};

      try{

        const updateRestoUserRes = await mRestoUser.update({
          restaurantId: null,
          isDeleted: true,
          deletedAt: App.getISODate(),
          isRestricted: true,
          restrictedAt: App.getISODate(),
        }, {transaction: tx});

        if( !App.isObject(updateRestoUserRes) || !App.isPosNumber(updateRestoUserRes.id) ){
          await tx.rollback();
          return App.json(res, false, App.t(['Failed to delete user'], req.lang));
        }
        // console.json({updateRestoUserRes});
        data_t = await App.getModel('User').getCommonDataFromObject(updateRestoUserRes);

        const mEmployee = await App.getModel('Employee').getByFields({ userId: mRestoUser.id });
        if( App.isObject(mEmployee) && App.isPosNumber(mEmployee.id) ){
          const updateAccountRes = await mEmployee.update({
            restaurantId: null,
            isDeleted: true,
            deletedAt: App.getISODate(),
            isRestricted: true,
            restrictedAt: App.getISODate(),
          }, {transaction: tx});
          if( !App.isObject(updateAccountRes) || !App.isPosNumber(updateAccountRes.id) ){
            console.error(App.t(['Failed to update employee', 'id', mEmployee.id])),
            console.json({mEmployee});
            await tx.rollback();
            return App.json(res, false, App.t(['Failed to delete employee id',mEmployee.id], req.lang));
          }
        }

        const mManager = await App.getModel('Manager').getByFields({ userId: mRestoUser.id });
        if( App.isObject(mManager) && App.isPosNumber(mManager.id) ){
          const updateAccountRes = await mManager.update({
            restaurantId: null,
            isDeleted: true,
            deletedAt: App.getISODate(),
            isRestricted: true,
            restrictedAt: App.getISODate(),
          }, {transaction: tx});
          if( !App.isObject(updateAccountRes) || !App.isPosNumber(updateAccountRes.id) ){
            console.error(App.t(['Failed to update manager id', mManager.id])),
            console.json({mManager});
            await tx.rollback();
            return App.json(res, false, App.t(['Failed to delete manager id',mManager.id], req.lang));
          }
        }

        await tx.commit();

      }catch(e){
        console.error(`#tx: ${e.message}`);
        await tx.rollback();
        return App.json(res, false, App.t(['Failed to delete user!'], req.lang));
      }

      App.json( res, true, App.t(['success'], res.lang), data_t);

    }catch(e){
      console.log(e);
      App.onRouteError( req, res, e );
      // App.json( res, false, App.t('request-could-not-be-processed', req.lang) );
    }

  });

  return { router, method: '', autoDoc:{} };

};


