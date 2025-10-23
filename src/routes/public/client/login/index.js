const express = require('express');
const router = express.Router();

// Client login with email/password
// Returns JWT token for authentication

// {
//   "email": "client@example.com",
//   "password": "password123"
// }

// /public/client/login

module.exports = function(App, RPath){

  router.use('', async(req, res)=>{

    try{

      const data = req.getPost();
      const email = App.tools.normalizeEmail(req.getCommonDataString('email', ''));
      const password = req.getCommonDataString('password', '');

      // Validate input
      if(!App.tools.isValidEmail(email))
        return await App.json(res, 417, App.t(['email', 'is-not', 'valid'], req.lang));

      if(App.isNull(password) || password.length < 3)
        return await App.json(res, 417, App.t(['password', 'must', 'be', 'at', 'least', '6', 'characters'], req.lang));

      // Find user by email
      const mUser = await App.getModel('User').findOne({
        where: {
          email: email,
          isDeleted: false,
        }
      });

      if(!App.isObject(mUser) || !App.isPosNumber(mUser.id))
        return await App.json(res, 401, App.t(['invalid', 'email', 'or', 'password'], req.lang));

      // Verify password
      const isPasswordValid = await App.BCrypt.compare(password, mUser.password);

      if(!isPasswordValid)
        return await App.json(res, 401, App.t(['invalid', 'email', 'or', 'password'], req.lang));

      // Check if account is restricted
      if(mUser.isRestricted)
        return await App.json(res, 403, App.t(['account', 'is', 'restricted'], req.lang));

      // Check if email is verified (optional - you may want to skip this for testing)
      // if(!mUser.isEmailVerified)
      //   return await App.json(res, 417, App.t(['please', 'verify', 'your', 'email', 'first'], req.lang));

      // Find or create client account
      let mClient = await App.getModel('Client').findOne({
        where: {
          userId: mUser.id,
          isDeleted: false,
        }
      });

      // Create client account if doesn't exist
      if(!App.isObject(mClient) || !App.isPosNumber(mClient.id)){
        mClient = await App.getModel('Client').create({
          userId: mUser.id,
          isVerified: true,
          isRestricted: false,
          verifiedAt: App.getISODate(),
        });

        if(!App.isObject(mClient) || !App.isPosNumber(mClient.id))
          return await App.json(res, false, App.t(['failed', 'to', 'create', 'client', 'account'], req.lang));

        // Create Stripe customer
        const stripeCustomerCreate = await App.payments.stripe.customerCreate({
          email: mUser.email,
          name: `${mUser.firstName || ''} ${mUser.lastName || ''}`.trim(),
          description: 'new customer',
          metadata: {
            userId: mUser.id,
            clientId: mClient.id,
          }
        });

        if(stripeCustomerCreate.success){
          await mClient.update({ customerId: stripeCustomerCreate.data.id });
        }

        // Create ClientPaymentSettings with platform-specific default payment type
        try{
          const paymentTypes = App.getModel('OrderPaymentType').getTypes();

          // Detect platform from request headers or user agent
          const userAgent = (req.headers['user-agent'] || '').toLowerCase();
          const osVersion = req.getCommonDataString('osVersion', '').toLowerCase();
          const platform = req.getCommonDataString('platform', '').toLowerCase();

          // Determine best payment type based on platform
          let defaultType = paymentTypes.Card; // Fallback

          if(osVersion.includes('ios') || platform.includes('ios') || userAgent.includes('iphone') || userAgent.includes('ipad')){
            // iOS device - prefer ApplePay
            defaultType = paymentTypes.ApplePay;
          } else if(osVersion.includes('android') || platform.includes('android') || userAgent.includes('android')){
            // Android device - prefer GooglePay
            defaultType = paymentTypes.GooglePay;
          } else if(paymentTypes.ApplePay){
            // Unknown platform - default to ApplePay if available
            defaultType = paymentTypes.ApplePay;
          }

          await App.getModel('ClientPaymentSettings').create({
            clientId: mClient.id,
            type: defaultType // Use platform-specific payment type
          });
        }catch(err){
          console.error('Failed to create ClientPaymentSettings:', err);
          // Non-critical, can be created later when needed
        }
      }

      // Also ensure ClientPaymentSettings exists for existing clients
      try{
        await App.getModel('ClientPaymentSettings').getByClientId(mClient.id);
      }catch(err){
        console.error('Error checking/creating ClientPaymentSettings:', err);
      }

      // Check if client account is restricted
      if(mClient.isRestricted)
        return await App.json(res, 403, App.t(['client', 'account', 'is', 'restricted'], req.lang));

      // Create or get session
      const sessionRes = await App.getModel('Session').getOrCreate({
        userId: mUser.id,
        country: res.info.country,
        ip: res.info.ip,
        isDeleted: false,
      });

      if(!sessionRes.success || !App.isObject(sessionRes.data) || !App.isPosNumber(sessionRes.data.id))
        return await App.json(res, false, App.t(['failed', 'to', 'create', 'session'], req.lang));

      const mSession = sessionRes.data;

      // Update session info
      const session_t = {
        country: res.info.country,
        timezone: res.info.timezone,
        ip: res.info.ip,
      };

      if(App.isString(data.fcmPushToken) && data.fcmPushToken.trim().length)
        session_t['fcmPushToken'] = data.fcmPushToken.trim();

      await mSession.update(session_t);

      // Update user role to client if needed
      if(mUser.role !== 'client'){
        await mUser.update({
          role: 'client',
          timezone: res.info.timezone,
        });
      }

      // Generate JWT token
      const jwtToken = await App.JWT.sign({
        userId: mUser.id,
        sessionId: mSession.id,
        token: mSession.token,
        role: 'client',
        country: res.info.country,
        timezone: res.info.timezone,
        ip: res.info.ip,
        date: App.getISODate(),
      });

      // Return success response
      await App.json(res, true, App.t(['login', 'successful'], req.lang), {
        token: jwtToken,
        userId: mUser.id,
        sessionId: mSession.id,
        role: 'client',
        user: {
          id: mUser.id,
          email: mUser.email,
          firstName: mUser.firstName,
          lastName: mUser.lastName,
          phone: mUser.phone,
          isEmailVerified: mUser.isEmailVerified,
          isPhoneVerified: mUser.isPhoneVerified,
        },
        client: {
          id: mClient.id,
          isVerified: mClient.isVerified,
          customerId: mClient.customerId,
        }
      });

    }catch(e){
      console.log(e);
      App.onRouteError(req, res, e);
    }

  });

  return { router, method: '', autoDoc:{} };

};
