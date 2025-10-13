const express = require('express');
const router = express.Router();

// {
//   "fullName": "required: <string>",
//   "email": "required: <string>",
//   "phone": "required: <string>",
//   "role": "required: ENUM: <string>: [ manager | employee ]"
// }

// /private/restaurant/employees/add/

module.exports = function(App, RPath){

  router.use('', async(req, res)=>{

    try{

      const data = req.getPost();
      // const mUser = await req.user;
      const mRestaurant = await req.restaurant;
      const roles = App.getModel('User').getRoles();

      if( !App.isString(data.fullName) || !data.fullName.length )
        return App.json( res, 417, App.t(['Full name is required'], req.lang));

      const fullName = data.fullName.trim().split(' ').map((m)=>m.trim());
      if( !App.isArray(fullName) || fullName.filter((v)=>v).length < 2 )
        return App.json( res, 417, App.t(['Full name is required'], req.lang));

      const user_t = {
        restaurantId: mRestaurant.id,
        isNewUser: false,
        firstName: App.tools.cleanName(fullName[0], false),
        lastName: App.tools.cleanName(fullName[1], false),
        email: App.tools.normalizeEmail(data.email),
        phone: App.tools.cleanPhone(data.phone),
        role: ([roles.manager, roles.employee].includes( data.role ) ? data.role : null),
        password: null,
        isPhoneVerified: true,
        // phoneVerifiedAt: App.getISODate(), // add field
        isEmailVerified: true,
        emailVerifiedAt: App.getISODate(),
        isRestricted: false,
        restrictedAt: null,
        isDeleted: false,
        deleteddAt: null,
      };

      // console.json({user_t: {0: user_t}});

      if( App.isNull( user_t.role ) )
        return App.json( res, 417, App.t(['Please select role of the worker'], req.lang));

      if( !App.tools.isValidPhone(user_t.phone) )
        return App.json(res, 417, App.t(['Phone is-not valid'], req.lang));

      if( !App.tools.isValidEmail(user_t.email) )
        return App.json(res, 417, App.t(['Email address is not valid'], req.lang));

      const mTestUser = await App.getModel('User').findOne({
        where: {
          // restaurantId: mRestaurant.id,
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

      const password = await App.BCrypt.randomSecureToken(12);
      user_t.password = await App.BCrypt.hash( password );

      // console.json({user_t: {1: user_t}});
      const mRestoUser = await App.getModel('User').create( user_t );
      if( !App.isObject(mRestoUser) || !App.isPosNumber(mRestoUser.id) )
        return App.json(res, false, App.t(['Failed to add new user'], req.lang));

      const accountType = (mRestoUser.role===roles.manager?'Manager':'Employee');
      const mAccount = await App.getModel( accountType ).create({
        restaurantId: mRestaurant.id,
        userId: mRestoUser.id,
        isVerified: true,
        verifiedAt: App.getISODate(),
        isRestricted: false,
        restrictedAt: null,
        isDeleted: false,
        deleteddAt: null,
      });

      if( !App.isObject(mAccount) || !App.isPosNumber(mAccount.id) )
        return App.json(res, false, App.t(['Failed to create related sub account'], req.lang));

      const newEmployeeEmailRes = await App.Mailer.send({
        to: mRestoUser.email,
        subject: App.t(['welcome','to', App.getEnv('APP_NAME')], req.lang),
        data: await App.Mailer.createEmailTemplate('restaurant-new-employee', { 
          lang: 'en',
          password: password,
        })
      });

      const data_t = {
        user: {
          id: mRestoUser.id,
          fullName: mRestoUser.fullName,
          firstName: mRestoUser.firstName,
          lastName: mRestoUser.lastName,
          email: mRestoUser.email,
          phone: mRestoUser.phone,
          role: mRestoUser.role,
          isEmailVerified: mRestoUser.isEmailVerified,
          isPhoneVerified: mRestoUser.isPhoneVerified,
          isVerified: mRestoUser.isVerified,
          verifiedAt: mRestoUser.verifiedAt,
          isRestricted: mRestoUser.isRestricted,
          restrictedAt: mRestoUser.restrictedAt,
          createdAt: mRestoUser.createdAt,
        },
        manager: (mRestoUser.role === roles.manager ? mAccount : null),
        employee: (mRestoUser.role === roles.employee ? mAccount : null),
      };

      // console.json({data_t});

      if( !newEmployeeEmailRes.success ){
        return App.json(res, 417, App.t([
          'Account has-been created but email with',
          'your password could not be sent at this moment'
        ], req.lang), data_t);        
      }

      App.json( res, true, App.t([
        'account-recovery-password-send', 'change-your-password'
      ], req.lang), data_t);

    }catch(e){
      console.log(e);
      App.onRouteError( req, res, e );
      // App.json( res, false, App.t('request-could-not-be-processed', req.lang) );
    }

  });

  return { router, method: '', autoDoc:{} };

};


