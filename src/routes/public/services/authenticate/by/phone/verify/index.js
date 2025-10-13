const express = require('express');
const router = express.Router();

// {
//   "phone": "required: <string>: eg: +14560123456",
//   "code": "required: <string>",
//   "type": "optional: ENUM: <string>: [ client | courier ]: only for new clients"
// }

// {
//   "phone": "{{DEV_PHONE}}",
//   "code": 1234,
//   "type": "courier"
// }

// /public/services/authenticate/by/phone/verify

const PREDEFINED_SMS_CODE = false; // 1234;

module.exports = function(App, RPath){

  router.use('', async(req, res)=>{

    try{

      // if( App.isEnv('rem') || App.isEnv('stage') || App.isEnv('prod') )
      //   return await App.json( res, 417, App.t(['Authentication by SMS-OTP is disabled, please user Google Authentication instead'], req.lang));

      const data = req.getPost();
      const phone = App.tools.cleanPhone( data.phone );
      const code = (+data.code).toString(); // 1000-9999
      const roles = App.getModel('User').getRoles({asArray: false});
      const type = req.getCommonDataString('type', null);

      const mSmsVerification = await App.getModel('SmsVerification').getLatestByPhoneAndCode({
        phone,
        code,
      });

      if( !App.isObject(mSmsVerification) || !App.isPosNumber(mSmsVerification.id) )
        return await App.json( res, 404, App.t(['verification','request','not','found'], req.lang));

      if( mSmsVerification.isExpired || mSmsVerification.isUsed )
        return await App.json( res, 417, App.t(['verification','code','has-been','expired'], req.lang));

      const password = await App.BCrypt.randomSecurePassword();
      const hash = await App.BCrypt.hash( password );

      if( !App.tools.isValidPhone(phone) )
        return await App.json(res, 417, App.t(['phone','is-not','valid'], req.lang));

      const isNewUser = !(!!(await App.getModel('User').isset({phone})));
      // console.debug({ data, isNewUser });

      if( ![ roles.client, roles.courier ].includes( type ) )
        return await App.json( res, 417, App.t(['you','have-to','select','account','type'], req.lang));

      if( isNewUser ){
        // if( ![roles.client, roles.courier].includes(type) )
        //   return await App.json( res, 417, App.t(['selected', 'account','type','is-not','supported'], req.lang), [roles.client, roles.courier] );
      }

      const mUser = await App.getModel('User').getByOrCreateWith( 
        { phone }, 
        { 
          phone, 
          password: hash, 
          // email: App.createSystemEmail(), 
          email: '',
          role: type, // isNewUser ? type : roles.client
        },
      );

      if( !App.isObject(mUser) || !App.isPosNumber(mUser.id) )
        return await App.json( res, false, App.t(['failed','to','init','account'], req.lang));

      if( mUser.isRestricted || mUser.isDeleted )
        return await App.json(res, 403, App.t(['Please, note that this account has been blocked. Contact us for any further information.'], req.lang));

      if( ![ roles.client, roles.courier ].includes(mUser.role) ){
        return await App.json(res, 417, App.t([
          'your','account','type','is',mUser.role,'and','cannot','be','used','to','login','as','client','or','courier'
        ], req.lang));
      }

      await mSmsVerification.update({ isUsed: true });

      let mClient = isNewUser ? null : await App.getModel('Client').getByFields({ userId: mUser.id });

      if( isNewUser ){

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
          console.error(`#stripe: ${stripeCustomerCreate.message}`);
          console.json({stripeCustomerCreate});
        }else{
          await mClient.update({ customerId: stripeCustomerCreate.data.id });
        }

      }

      if( mClient.isRestricted || mClient.isDeleted )
        return await App.json(res, 403, App.t(['Please, note that this account has been blocked. Contact us for any further information.'], req.lang));

      // it will be verified by {apple,google, etc...}
      const userUpdateRes = await mUser.update({
        isPhoneVerified: true,
        timezone: res.info.timezone,
        role: [roles.client, roles.courier].includes(type) ? type : mUser.role,
      });

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
            checksum: true,
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
      //  role: userUpdateRes.role, 
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


