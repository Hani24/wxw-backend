const express = require('express');
const router = express.Router();

// {
//   "phone": "required: <string>: eg: +14560123456"
// }

// {
//   "phone": "{{DEV_PHONE}}"
// }

// /public/services/authenticate/by/phone/request/

const PREDEFINED_SMS_CODE = 1234;

module.exports = function(App, RPath){

  router.use('', async(req, res)=>{

    try{

      const data = req.getPost();

      const phone = App.tools.cleanPhone( data.phone );
      const roles = App.getModel('User').getRoles();

      if( !App.tools.isValidPhone(phone) )
        return App.json(res, 417, App.t(['phone','is-not','valid'], req.lang));

      const mUser = await App.getModel('User').findOne({
        where: {phone}
      });

      if( App.isObject(mUser) && App.isPosNumber(mUser.id) ){

        if( mUser.isRestricted || mUser.isDeleted )
          return App.json(res, 403, App.t([
            'Please, note that this account has been blocked. Contact us for any further information.'
          ], req.lang));

        if( ![ roles.client, roles.courier ].includes(mUser.role) ){
          return App.json(res, 417, App.t([
            'your','account','type','is',mUser.role,'and','cannot','be','used','to','login','as','client','or','courier'
          ], req.lang));
        }
      }

      let mSmsVerification = await App.getModel('SmsVerification').getLatestByPhone({phone});

      if( !App.isObject(mSmsVerification) || !App.isPosNumber(mSmsVerification.id) ){
        mSmsVerification = await App.getModel('SmsVerification').create({
          phone,
          code: await App.getModel('SmsVerification').createSmsCode( PREDEFINED_SMS_CODE ),
          ip: res.info.ip,
        });
        if( !App.isObject(mSmsVerification) || !App.isPosNumber(mSmsVerification.id) ){
          return App.json( res, false, App.t(['server','error','could','not','initialize','phone','validation'], req.lang));
        }
      }else{

        if( !PREDEFINED_SMS_CODE ){
          if( App.getModel('SmsVerification').isRateLimited( mSmsVerification.createdAt, 1, 'minute' ) )
            return App.json( res, 417, App.t(['rate','limit','1','sms','/','minute'], req.lang));
        }

      }

      if( !PREDEFINED_SMS_CODE ){
        const appName = App.getEnv('APP_NAME');
        const smsMessage = App.t([appName, 'OTP', mSmsVerification.code], res.lang);
        const sendSmsRes = await App.sms.clicksend.send( phone, smsMessage );
        if( !sendSmsRes.success )
          return App.json( res, 500, App.t(sendSmsRes.message, req.lang));        
      }

      console.debug({
        id: mSmsVerification.id,
        phone: mSmsVerification.phone,
        code: mSmsVerification.code,
        ip: mSmsVerification.ip,
      });

      // "id": 1678,
      // "phone": "+380631928928",
      // "code": "1234",
      // "maxAge": 0,
      // "isExpired": false,
      // "isUsed": false,
      // "ip": "178.136.126.18",
      // "createdAt": "2022-01-17T13:44:56.000Z",
      // "updatedAt": "2022-01-17T13:44:56.000Z"

      App.json( res, true, App.t(['OTP','code','has-been','sent'], res.lang), {});

    }catch(e){
      console.log(e);
      App.onRouteError( req, res, e );
      // App.json( res, false, App.t('request-could-not-be-processed', req.lang) );
    }

  });

  return { router, method: '', autoDoc:{} };

};


