const express = require('express');
const router = express.Router();

// /public/courier/email-verification/verify/code/:code

module.exports = function(App, RPath){

  router.use('', App.modifiers.noBots, async(req, res,next)=>{

    try{

      // if( App.modifiers.isBot(req) ){}
      await console.sleep(1500);

      const data = req.getPost();
      const code = req.getCommonDataString('code', false);
      const roles = App.getModel('User').getRoles();

      if( !code ){
        return await App.renderUI( res, 'message', {
          header: App.t(['email-verification'], req.lang),
          message: App.t(['Verification','code','is required.'], req.lang, ''),
          icon: { name: 'error', size: 100 },
        });
      }

      // [dev]
      // const mEmailVerification = await App.getModel('EmailVerification').findOne({ 
      //   where:{code},
      // });

      const mEmailVerification = await App.getModel('EmailVerification').getLatestByCode({ 
        code,
      });

      if( !App.isObject(mEmailVerification) || !App.isPosNumber(mEmailVerification.id) ){
        return await App.renderUI( res, 'message', {
          header: App.t(['email-verification'], req.lang),
          message: App.t(['Verification','[code]','not','found','or','/','and','has-been','expired.'], req.lang, ''),
          icon: { name: 'error', size: 100 },
        });
      }

      const mUser = await App.getModel('User').getById( mEmailVerification.userId );
      if( !App.isObject(mUser) || !App.isPosNumber(mUser.id) ){
        return await App.renderUI( res, 'message', {
          header: App.t(['email-verification'], req.lang),
          message: App.t(['User','not','found.'], req.lang, ''),
          icon: { name: 'error', size: 100 },
        });
      }

      const mUserCommon = await App.getModel('User').getCommonDataFromObject( mUser );
      if( !mUserCommon.hasCourierAccount && mUser.role !== roles.courier ){
        return await App.renderUI( res, 'message', {
          header: App.t(['email-verification'], req.lang),
          message: App.t(['Forbidden.'], req.lang, ''),
          icon: { name: 'error', size: 100 },
        });
      }

      if( mUser.isRestricted || mUser.isDeleted ){
        return await App.renderUI( res, 'message', {
          message: App.t(['verification','error'], req.lang, ''),
          message: App.t(['Access','has-been','restricted.'], req.lang),
          icon: { name: 'error', size: 100 },
        });        
      }

      const updateUser = await mUser.update({isEmailVerified: true});

      if( !App.isObject(updateUser) || !App.isPosNumber(updateUser.id) ){
        return await App.renderUI( res, 'message', {
          message: App.t(['verification','error'], req.lang, ''),
          message: App.t(['Failed to','update','user','account'], req.lang),
          icon: { name: 'error', size: 100 },
        });
      }

      const mCourier = await App.getModel('Courier').findOne({
        where: { 
          userId: updateUser.id
        },
        attributes: ['id','isVerified','isRestricted','isRequestSent']
      });

      if( !App.isObject(mCourier) || !App.isPosNumber(mCourier.id) ){
        return await App.renderUI( res, 'message', {
          header: App.t(['email-verification'], req.lang),
          message: App.t(['Courier','not','found.'], req.lang, ''),
          icon: { name: 'error', size: 100 },
        });
      }

      if( !mCourier.isVerified && !mCourier.isRequestSent && !mCourier.isRestricted && updateUser.isEmailVerified ){

        // required fields for admin validation + isEmailVerified
        const user_t = ['email','firstName','lastName','birthday','cityId'];

        const dataIsFulfilled = user_t
          .filter((mKey)=>(!!updateUser[ mKey ]))
          .length === user_t.length;

        if( dataIsFulfilled ){
          let accountId = mCourier.accountId;
          let personId = mCourier.personId;

          const mCity = await App.getModel('City').findOne({
            where: {id: mUser.cityId},
            attributes: ['id','name'],
            include:[{
              model: App.getModel('State'),
              attributes: ['id','name'],
            }]
          });

          const clientInfo = {
            firstName: mUser.firstName,
            lastName: mUser.lastName,
            email: mUser.email,
            phone: mUser.phone, // only US based number
            birthday: mUser.birthday,
            metadata: {
              userId: mUser.id,
              courierId: mCourier.id,
            }
          };

          const addressInfo = {
            state: mCity.State.name,
            zip: mUser.zip,
            city: mCity.name,
            street: mUser.street,
          };

          let stripeAccountRes = await App.payments.stripe.accountGetById( mCourier.accountId || 'n/a' );

          if( App.isNull(mCourier.accountId) || !stripeAccountRes.success ){
            stripeAccountRes = await App.payments.stripe
              .accountCreate( clientInfo, addressInfo, {ip: res.info.ip } );

            if( !stripeAccountRes.success )
              console.error(` #stripeAccountRes: [userId: ${mUser.id}, courierId: ${mCourier.id}] ${stripeAccountRes.message} `);

          }else{
            stripeAccountRes = await App.payments.stripe
              .customerUpdateById(mCourier.accountId, clientInfo, addressInfo, {ip: res.info.ip } );

            if( !stripeAccountRes.success )
              console.error(` #stripeAccountRes: [userId: ${mUser.id}, courierId: ${mCourier.id}] ${stripeAccountRes.message} `);

          }

          if( !stripeAccountRes.success ){
            return await App.renderUI( res, 'message', {
              message: App.t(['Failed to','update','external','account.'], req.lang, ''),
              message: App.t([stripeAccountRes.message], req.lang),
              icon: { name: 'error', size: 100 },
            });
          }

          accountId = stripeAccountRes.data.id; //  === acct_***;
          personId = stripeAccountRes.data.individual.id; //  === person_***;

          const updateCourier = await mCourier.update({
            isRequestSent: true,
            requestSentAt: App.getISODate(),
            accountId,
            personId,
            // set as current, until he enables GPS
            lat: res.info.lat,
            lon: res.info.lon,
          });

          if( !App.isObject(updateCourier) || !App.isPosNumber(updateCourier.id) ){
            return await App.renderUI( res, 'message', {
              message: App.t(['verification','error'], req.lang, ''),
              message: App.t(['Failed to','update','courier','account.'], req.lang),
              icon: { name: 'error', size: 100 },
            });
          }

        }
      }

      await mEmailVerification.update({isUsed: true, isExpired: true });

      await App.renderUI( res, 'message', {
        header: App.t(['Thank you!'], req.lang),
        message: App.t(['email-has-been-verified','You can now log into your account and start your KYC procedure.'], req.lang, ''),
        icon: { name: 'success', size: 100 },
      });

      const pushToCourierRes = await App.getModel('CourierNotification')
        .pushToCourierById( mCourier.id , {
          type: App.getModel('CourierNotification').getTypes()['courierKycVerificationRequired'],
          title: `${ App.t(['please-complete-kyc'], mUser.lang) }`,
          message: `${ App.t(['please-complete-kyc'], mUser.lang) }`,
          data: {},
        });

      if( !pushToCourierRes.success ){
        console.error('courierKycVerificationRequired');
        console.json({pushToCourierRes});
      }

      // const welcomeEmailRes = await App.Mailer.send({
      //   to: updateUser.email,
      //   subject: App.t('welcome-new-user', updateUser.lang),
      //   data: await App.Mailer.createEmailTemplate('welcome-new-user', { 
      //     lang: updateUser.lang,
      //     updateUser: mUser,
      //   })
      // });
      // if( welcomeEmailRes.success ){}

    }catch(e){
      console.log(e);
      App.onRouteError( req, res, e );
      // App.json( res, false, App.t('request-could-not-be-processed', req.lang) );
    }

  });

  return { router, method: '', autoDoc:{} };

};


