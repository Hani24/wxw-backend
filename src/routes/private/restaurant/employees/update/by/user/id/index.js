const express = require('express');
const router = express.Router();

// {
//   "userId": "required: <number>: Ref. User.id",
//   "fullName": "optional: <string>",
//   "email": "optional: <string>",
//   "phone": "optional: <string>",
//   "role": "optional: ENUM: <string>: [ manager | employee ]"
// }

// {
//   "userId": 22,
//   "email": "abc-updated@gmail.be",
//   "phone": "+32000008888",
//   "fullName": "Tom Bobasen",
//   "role": "manager"
// }

// /private/restaurant/employees/update/by/user/id/:id

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
        role: { [ App.DB.Op.in ]: [ roles.manager, roles.employee ] },
        isDeleted: false,
        isRestricted: false,
      });

      if( !App.isObject(mRestoUser) || !App.isPosNumber(mRestoUser.id) )
        return App.json( res, 404, App.t(['Employee not found and/or does not belong to restaurant'], req.lang) );

      const user_t = {
        email: App.tools.normalizeEmail( req.getCommonDataString('email', mRestoUser.email) ),
        phone: App.tools.cleanPhone( req.getCommonDataString('phone', mRestoUser.phone) ),
        role: ([roles.manager, roles.employee].includes( data.role ) ? data.role : mRestoUser.role),
        isPhoneVerified: true,
        isEmailVerified: true,
        emailVerifiedAt: App.getISODate(),
        // isRestricted: false,
        // restrictedAt: null,
      };

      if( App.isString(data.fullName) && data.fullName.length ){
        const fullName = data.fullName.trim().split(' ').map((m)=>m.trim());
        if( App.isArray(fullName) && fullName.filter((v)=>v).length >= 2 ){
          user_t.firstName = App.tools.cleanName(fullName[0], false);
          user_t.lastName = App.tools.cleanName(fullName[1], false);
          if( !App.isString(user_t.firstName) || !user_t.firstName.length ) delete user_t.firstName;
          if( !App.isString(user_t.lastName) || !user_t.lastName.length ) delete user_t.lastName;
        }
      }

      if( App.isNull( user_t.role ) )
        return App.json( res, 417, App.t(['Please select role of the worker'], req.lang));

      if( !App.tools.isValidPhone(user_t.phone) )
        return App.json(res, 417, App.t(['Phone is not valid'], req.lang));

      if( !App.tools.isValidEmail(user_t.email) )
        return App.json(res, 417, App.t(['email address is not valid'], req.lang));

      const mTestUser = await App.getModel('User').findOne({
        where: {
          // restaurantId: mRestaurant.id,
          id: { [App.DB.Op.not]: mRestoUser.id },
          isDeleted: false,
          isRestricted: false,
          // role: { [ App.DB.Op.in ]: [ roles.manager, roles.employee ] },
          [ App.DB.Op.or ]: {
            email: user_t.email,
            phone: user_t.phone,
          }
        },
      });

      if( App.isObject(mTestUser) ){
        const type_t = (mTestUser.email===user_t.email?'email':'phone');
        return App.json(res, 417, App.t(['User with',type_t,'already exists'], req.lang));
      }

      const updateUserRes = await mRestoUser.update(user_t);
      if( !App.isObject(updateUserRes) || !App.isPosNumber(updateUserRes.id) )
        return App.json(res, false, App.t(['Failed to update user'], req.lang));

      const employee_t = {
        userId: mRestoUser.id,
        restaurantId: mRestaurant.id,
        isVerified: true,
        verifiedAt: App.getISODate(),
        isRestricted: false,
        restrictedAt: null,
        isDeleted: false,
        deleteddAt: null,
      };

      if( updateUserRes.role === roles.employee && !( await App.getModel('Employee').isset({ userId: mRestoUser.id }) ) ){
        const mAccount = await App.getModel('Employee').create( employee_t );
        if( !App.isObject(mAccount) || !App.isPosNumber(mAccount.id) ){
          return App.json(res, false, App.t(['Failed to init','[employee]','account'], req.lang));
        }
      }

      if( updateUserRes.role === roles.manager && !( await App.getModel('Manager').isset({ userId: mRestoUser.id }) ) ){
        const mAccount = await App.getModel('Manager').create( employee_t );
        if( !App.isObject(mAccount) || !App.isPosNumber(mAccount.id) ){
          return App.json(res, false, App.t(['Failed to init','[manager]','account'], req.lang));
        }        
      }

      const data_t = await App.getModel('User').getCommonDataFromObject(updateUserRes);
      App.json( res, true, App.t(['success'], res.lang), data_t);

    }catch(e){
      console.log(e);
      App.onRouteError( req, res, e );
      // App.json( res, false, App.t('request-could-not-be-processed', req.lang) );
    }

  });

  return { router, method: '', autoDoc:{} };

};


