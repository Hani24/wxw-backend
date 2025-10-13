const express = require('express');
const router = express.Router();

// /private/courier/kyc/get/link/

module.exports = function(App, RPath){

  router.use('', async(req, res)=>{

    try{

      const data = req.getPost();
      const mUser = await req.user;
      const mCourier = await req.courier;

      // const mCommonUser = await App.getModel('User').getCommonDataFromObject( mUser );
      // const mCommonCourier = await App.getModel('Courier').getCommonDataFromObject( mCourier );

      if( mUser.isVerified && mCourier.isKycCompleted )
        return App.json(res, 417, App.t(['account-is-already-verified'], req.lang));

      if( !mUser.isVerified && mCourier.isKycCompleted )
        return App.json(res, 417, App.t(['kyc-after-success...'], req.lang));

      if( !mUser.isEmailVerified )
        return App.json(res, 417, App.t(['email-address-verification-is-required'], req.lang));

      if( !mCourier.isRequestSent || !App.isString(mCourier.accountId) || !mCourier.accountId.match(/^acct_/) )
        return App.json(res, 417, App.t(['please-complete-all-steps-to-start-kyc'], req.lang));

      // mUser.
      //   isEmailVerified
      //   isPhoneVerified

      // mCourier.
      //   personId
      //   accountId
      //   isVerified, verifiedAt
      //   isRequestSent, requestSentAt
      //   isKycCompleted, kycCompletedAt

      const mKycLinkRes = await App.payments.stripe.getKYCAccountLink( mCourier.accountId );
      // {
      //   success: true, 
      //   message: 'success', 
      //   data: {
      //     createdAt,
      //     expiresAt,
      //     expiresIn,
      //     url,
      //   }
      // }

      await App.json( res, mKycLinkRes );

    }catch(e){
      console.log(e);
      App.onRouteError( req, res, e );
      // App.json( res, false, App.t('request-could-not-be-processed', req.lang) );
    }

  });

  return { router, method: '', autoDoc:{} };

};


