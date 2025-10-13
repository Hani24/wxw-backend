const express = require('express');
const router = express.Router();

// {
//   "firstName": "optional: <string>",
//   "lastName": "optional: <string>",
//   "birthday": "optional: <string> | ISO-8601",
//   "email": "optional: <string>: must be revalidated if changed",
//   "cityId": "optional: <number>: Ref. City.id",
//   "street": "optional: <string>",
//   "zip": "optional: <string>",
//   "example": {
//     "firstName": "Bob",
//     "lastName": "Andersen",
//     "birthday": "1988-09-18",
//     "email": "cyyk2@coooooool.com",
//     "cityId": 768,
//     "street": "24, Walnut Avenue",
//     "zip": "94941"
//   } 
// }

// {
//   "firstName": "optional: <string>",
//   "lastName": "optional: <string>",
//   "birthday": "optional: <string> | ISO-8601",
//   "email": "optional: <string>: must be revalidated if changed",
//   "cityId": "optional: <number>: Ref. City.id",
//   "zip": "optional: <string>"
// }

// "24, Walnut Avenue, Mill Valley, Marin County, California, 94941, United States"
// "stateId": 6, "cityId": 768, "street": "24 Walnut Street",
// {
//   "firstName": "Bob",
//   "lastName": "Andersen",
//   "birthday": "1988-09-18",
//   "email": "cyyk2@coooooool.com",
//   "cityId": 768,
//   "street": "24, Walnut Avenue",
//   "zip": "94941"
// }

// /private/courier/profile/update/

module.exports = function(App, RPath){

  router.use('', async(req, res)=>{

    try{

      const data = req.getPost();
      const mUser = await req.user;
      const mCourier = await req.courier;
      let emailHasBeenUpdated = false;

      if( App.isPosNumber(mCourier.isRequestSent) ){
        const verifyAccess = App.getModel('Courier').verifyAccess( mCourier );
        if( !verifyAccess.success )
          return App.json(res, 417, App.t(verifyAccess.message, req.lang),{
            requestSentAt: mCourier.requestSentAt,
          });
      }

      if( mCourier.isVerified )
        return App.json(res, 417, App.t(['your','account','has-been','verified'], req.lang), {
          verifiedAt: mCourier.verifiedAt
        });

      const user_t = {
        email: App.tools.normalizeEmail( req.getCommonDataString('email', mUser.email) ),
        firstName: App.tools.cleanName(req.getCommonDataString('firstName', mUser.firstName), false),
        lastName: App.tools.cleanName(req.getCommonDataString('lastName', mUser.lastName), false),
        birthday: req.getCommonDataString('birthday', mUser.birthday || App.getISODate()),
        cityId: req.getCommonDataInt('cityId', mUser.cityId),
        zip: req.getCommonDataString('zip', mUser.zip),
        street: req.getCommonDataString('street', mUser.street),
      };

      if( !(await App.getModel('City').isset({id: user_t.cityId}) ) )
        user_t.cityId = mUser.cityId;

      if( user_t.email !== mUser.email ){

        if( !App.tools.isValidEmail(user_t.email) )
          return App.json(res, 417, App.t(['email-address','is','not','valid'], req.lang));

        const doubleRecordRes = await App.getModel('User').findOne({
          where: {
            id: { [App.DB.Op.not]: mUser.id },
            isDeleted: false,
            isRestricted: false,
            email: user_t.email,
	    role: 'courier',
	   
          }
        });

        if( App.isObject(doubleRecordRes) && App.isPosNumber(doubleRecordRes.id) )
          return App.json(res, 417, App.t('user-with-email-already-exists', req.lang));

        emailHasBeenUpdated = true;

      }

      if( !App.DT.isValidDatetime(user_t.birthday) )
        return App.json(res, 417, App.t(['birthday','is-not','valid',',','please','use','ISO-8601'], req.lang));        

      if( !App.DT.requireMinAge(user_t.birthday, App.getModel('User').getMinAge()) )
        return App.json(res, 417, App.t('Customer must be at least 13 years old', req.lang));

      if( user_t.birthday !== mUser.birthday )
        user_t.birthday = App.DT.cleanUpBirthday(user_t.birthday, mUser.timezone );

      const updateUser = await mUser.update({
        ...user_t,
        isNewUser: false,
      });

      if( !App.isObject(updateUser) || !App.isPosNumber(updateUser.id) )
        return App.json(res, false, App.t(['failed-to','update','user'], req.lang));

      if( !mUser.isEmailVerified /* emailHasBeenUpdated */ ){

        await mUser.update({ isEmailVerified: false });
        const code = App.BCrypt.randomSecureToken(12); // 64^12 => 

        const mEmailVerification = await App.getModel('EmailVerification').create({
          userId: mUser.id,
          email: mUser.email,
          code: code,
        });

        if( !App.isObject(mEmailVerification) || !App.isPosNumber(mEmailVerification.id) )
          return App.json( res, false, App.t(['failed','to','create','email-verification'], req.lang));

        // --------------------------
        const sendRes = await App.Mailer.send({
          to: mUser.email,
          subject: App.t('email-verification', mUser.lang),
          data: await App.Mailer.createEmailTemplate('email-verification', { 
            lang: mUser.lang,
            code: code,
            platform: 'web',
            webPath: App.toAppPath( 'web', 'courier.email-verification-verify', code),
          })
        });

        if( !sendRes.success )
          return App.json( res, sendRes.success, App.t( sendRes.message, mUser.lang) );
        // --------------------------


        // destroy all open sessions
        // await App.getModel('Session').destroy({
        //   where: { userId: mUser.id }
        // });

        await App.json( res, true, App.t([
          'we-have-sent-you-confirmation-email', 
          'click-verify-email',
        ], req.lang, ' ') /*,{code}*/);

        const pushToCourierRes = await App.getModel('CourierNotification')
          .pushToCourierById( mCourier.id, {
            type: App.getModel('CourierNotification').getTypes()['courierEmailVerificationRequired'],
            title: `${ App.t(['verify-your-email-address'], mUser.lang) }`,
            message: `${ App.t(['we-have-sent-you-confirmation-email'], mUser.lang) }`,
            data: {},
          });

        if( !pushToCourierRes.success ){
          console.error('courierEmailVerificationRequired');
          console.json({pushToCourierRes});
        }

        return;

      }

      await App.json( res, true, App.t(['account','has-been','updated'], res.lang), user_t );

      if( !mCourier.isVerified && !mCourier.isRequestSent && mUser.isEmailVerified && !mCourier.isRestricted ){

        const dataIsFulfilled = Object.keys(user_t)
          .filter((mKey)=>(!!updateUser[ mKey ]))
          .length === Object.keys(user_t).length;

        if( dataIsFulfilled ){
          const updateCourierRes = await mCourier.update({
            isRequestSent: true,
            requestSentAt: App.getISODate(),            
          });
          if( !App.isObject(updateCourierRes) || !App.isPosNumber(updateCourierRes.id) )
            return console.error(` [0]: updateCourierRes => isRequestSent: could not update`);
          console.ok(` [0]: updateCourierRes => isRequestSent: success`);
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


