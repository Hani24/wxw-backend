const express = require('express');
const router = express.Router();

// /public/services/firebase/auth/by/token

// {
//   "idToken": "required: <string> [id-token] from firebase",
//   "type": "optional: ENUM: <string> [ client | courier ]"
// }

// {
//   "idToken": "{{ID_TOKEN_DEV_TEST}}",
//   "type": "client"
// }

module.exports = function(App, RPath){

  router.use('', App.multer.upload.form.any(), async(req, res)=>{

    try{

      // if( App.isEnv('.....') )
      //   return await App.json( res, 417, App.t(['Google Authentication is disabled, please user SMS-OTP instead'], req.lang));

      const data = req.getPost();
      const idToken = req.getCommonDataString('idToken', '');
      const type = req.getCommonDataString('type', null);
      const roles = App.getModel('User').getRoles({asArray: false});

      // if( App.isNull(type) )
      //   return await App.json( res, 417, App.t(['you','have-to','select','account','type'], req.lang));

//      if( ![roles.client, roles.courier].includes(type) )
 //       return await App.json( res, 417, App.t(['selected', 'account','type','is-not','supported'], req.lang), [roles.client, roles.courier] );

      // firebase auth by [id-token]
      const authRes = await App.firebase.verifyIdToken( idToken );

      // {
      //   "authRes": {
      //     "success": true,
      //     "message": "OK",
      //     "data": {
      //       "iss": "https://securetoken.google.com/wxw-delivery",
      //       "aud": "wxw-delivery",
      //       "auth_time": 1658308315,
      //       "user_id": "84w6OQUu9tYz7hbUuIdVf0iN5DG2",
      //       "sub": "84w6OQUu9tYz7hbUuIdVf0iN5DG2",
      //       "iat": 1658308315,
      //       "exp": 1658311915,
      //       "phone_number": "+12175797458",
      //       "firebase": {
      //         "identities": {
      //           "phone": [
      //             "+12175797458"
      //           ]
      //         },
      //         "sign_in_provider": "phone"
      //       },
      //       "uid": "84w6OQUu9tYz7hbUuIdVf0iN5DG2"
      //     }
      //   }
      // }

      if( !authRes.success ){
        console.json({authRes});
        return await App.json(res, 401, App.t(authRes.message, req.lang));
      }

      const data_t = authRes.data;

      const provider = (data_t.firebase && data_t.firebase.sign_in_provider)
        ? data_t.firebase.sign_in_provider
        : null;

      const password = await App.BCrypt.randomSecurePassword();
      const hash = await App.BCrypt.hash( password );

      let phone = null;
      let email = null;
      let isPhoneAuth = false;
      let isEmailAuth = false;

      // Determine authentication provider and extract credentials
      if (provider === 'phone') {
        // Phone authentication
        phone = App.tools.cleanPhone(data_t.phone_number);

        if (!App.tools.isValidPhone(data_t.phone_number))
          return await App.json(res, 417, App.t(['phone','number','is-not','valid'], req.lang));

        isPhoneAuth = true;

      } else if (provider === 'password') {
        // Email authentication
        email = App.tools.normalizeEmail(data_t.email);

        if (!App.tools.isValidEmail(email))
          return await App.json(res, 417, App.t(['email','is-not','valid'], req.lang));

        isEmailAuth = true;
        // Generate unique placeholder for phone field (unique constraint)
        phone = `EMAIL_${data_t.uid}`;

      } else {
        return await App.json(res, 417, App.t(['authentication','provider','not','supported'], req.lang));
      }

      // Find existing user by phone or email depending on provider
      const whereClause = isEmailAuth ? { email } : { phone };
      let existingUser = await App.getModel('User').getByFields(whereClause);
      let isNewUser = !existingUser;

      // if( isNewUser ){
      //   if( ![roles.client, roles.courier].includes(type) )
      //     return await App.json( res, 417, App.t(['selected', 'account','type','is-not','supported'], req.lang), [roles.client, roles.courier] );
      // }

      if (!isNewUser && type === roles.client && existingUser.role !== roles.client) {
        isNewUser = true;
        existingUser = null;
      }

      // Create new user with appropriate credentials based on auth provider
      const mUser = isNewUser
        ? await App.getModel('User').create({
            phone: phone,
            password: hash,
            email: isEmailAuth ? email : '',
            role: type,
            isPhoneVerified: isPhoneAuth,
            isEmailVerified: isEmailAuth,
          })
        : existingUser;

    //  const mUser = await App.getModel('User').getByOrCreateWith( 
    //    { phone }, 
    //    { 
    //      phone, 
    //      password: hash, 
          // email: App.createSystemEmail(), 
    //      email: '',
    //      role: type, // isNewUser ? type : roles.client
    //    },
    //  );

      if( !App.isObject(mUser) || !App.isPosNumber(mUser.id) )
        return await App.json( res, false, App.t(['failed','to','init','account'], req.lang));

      if( mUser.isRestricted || mUser.isDeleted )
        return await App.json(res, 403, App.t(['Please, note that this account has been blocked. Contact us for any further information.'], req.lang));

    //  if( ![ roles.client, roles.courier ].includes(mUser.role) ){
    //    return await App.json(res, 417, App.t([
    //      'your','account','type','is',mUser.role,'and','cannot','be','used','to','login','as','client','or','courier'
    //    ], req.lang));
    //  }

      // await mSmsVerification.update({ isUsed: true });

      let mClient = isNewUser ? null : await App.getModel('Client').getByFields({ userId: mUser.id });

      if( isNewUser || !mClient ){

        // Create Clients account anyway, courier will be able to switch to Clients account
        mClient = await App.getModel('Client').create({
          userId: mUser.id,
          isVerified: true,
          isRestricted: false,
          verifiedAt: App.getISODate(),
          restrictedAt: null,
        });

        if( !App.isObject(mClient) || !App.isPosNumber(mClient.id) )
          return await App.json( res, false, App.t(['failed','to','create','client','account'], req.lang));

        // switch(type){
        //   case roles.client: 
        //     // pass
        //     break;
        //   case roles.courier: 
        //     // pass
        //     break;
        // }

        const stripeCustomerCreate = await App.payments.stripe.customerCreate({
          email: mUser.email,
          name: `${mUser.firstName} ${mUser.lastName}`,
          description: 'new customer',
          metadata: {
            userId: mUser.id,
            clientId: mClient.id,
          }
        });
        if( !stripeCustomerCreate.success ){
          console.error(stripeCustomerCreate.message);
          console.json({stripeCustomerCreate});
        }else{
          await mClient.update({ customerId: stripeCustomerCreate.data.id });
        }

      }

      if( mClient.isRestricted || mClient.isDeleted )
        return await App.json(res, 403, App.t(['Please, note that this account has been blocked. Contact us for any further information.'], req.lang));

      // it will be verified by {apple,google, firebase, etc...}
      const updateData = {
        timezone: res.info.timezone,
        role: type,
        //  role: [roles.client, roles.courier].includes(type) ? type : mUser.role,
      };

      // Update verification status based on auth provider
      if (isPhoneAuth) {
        updateData.isPhoneVerified = true;
      } else if (isEmailAuth) {
        updateData.isEmailVerified = true;
      }

      const userUpdateRes = await mUser.update(updateData);

      if( !App.isObject(userUpdateRes) || !App.isPosNumber(userUpdateRes.id) )
        return await App.json( res, false, App.t(['failed','to','update','user','profile'], req.lang));

      const sessionRes = await App.getModel('Session').getOrCreate({
        userId: mUser.id,
        country: res.info.country,
        // timezone: res.info.timezone,
        ip: res.info.ip,
        isDeleted: false,
      });

      if( !sessionRes.success || !App.isObject(sessionRes.data) || !App.isPosNumber(sessionRes.data.id) ){
        // return await App.json( res, false, App.t(['failed','to','create','session'], req.lang));
        return await App.json( res, sessionRes );
      }

      const mSession = sessionRes.data;
      const session_t = {
        country: res.info.country,
        timezone: res.info.timezone,
        ip: res.info.ip,
      };

      if( App.isString(data.fcmPushToken) && data.fcmPushToken.trim().length )
        session_t['fcmPushToken'] = data.fcmPushToken.trim();

      const sessionUpdateRes = await mSession.update( session_t );

      if( !App.isObject(sessionUpdateRes) || !App.isPosNumber(sessionUpdateRes.id) )
        return await App.json( res, false, App.t(['failed','to','update','session'], req.lang));

      const hasCourierAccount = await App.getModel('Courier').hasCourierAccount( mUser.id );

      let mCourier = null;

      if( roles.courier === type ){
        if( !hasCourierAccount ){

          mCourier = await App.getModel('Courier').create({
            userId: mUser.id,
            isVerified: false, // 3 days in admin-panel
            verifiedAt: null,
            isRestricted: false,
            restrictedAt: null,
          });

          if( !App.isObject(mCourier) || !App.isPosNumber(mCourier.id) )
            return await App.json( res, false, App.t(['failed','to','create','courier','account'], req.lang));

          // const stripeCourierCreate = await App.payments.stripe.customerCreate({
          //   email: mUser.email,
          //   name: `${mUser.firstName} ${mUser.lastName}`,
          //   description: 'new customer',
          //   metadata: {
          //     userId: mUser.id,
          //     courierId: mCourier.id,
          //   }
          // });

        }
      }

      const jwtToken = await App.JWT.sign({
        userId: mUser.id, 
        sessionId: mSession.id, 
        token: mSession.token,
        role: userUpdateRes.role, 
        // lang: mUser.lang, 
        // date: App.getISODate(),
      });

      // init ...
      const mUserSettings = await App.getModel('UserSettings').getByUserId( mUser.id );

      /* await */ App.json( res, true, App.t('success', res.lang), {
        userId: mUser.id, 
        sessionId: mSession.id, 
        token: jwtToken,
        isNewUser: mUser.isNewUser,
	isEmailVerified: mUser.isEmailVerified,
        hasCourierAccount,
        isCourierInited: (hasCourierAccount && (!! mUser.cityId)),
        role: userUpdateRes.role,
      });

      // if( !App.isNull(mCourier) ){
      // }

      // if( !App.isNull(mClient) ){
      // }

    }catch(e){
      console.log(e);
      App.onRouteError( req, res, e );
      // App.json( res, false, App.t('request-could-not-be-processed', req.lang) );
    }

  });

  return { router, method: '', autoDoc:{} };

};

