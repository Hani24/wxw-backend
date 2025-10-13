const express = require('express');
const router = express.Router();

/*
 * Resend Email Verification API
 * This is a separate route that handles resending verification emails.
 * Path: /private/client/verification/resend/
 */

module.exports = function(App, RPath) {
  console.log('[VERIFICATION RESEND] Router initialized with path:', RPath);

  // Debug middleware to track requests
  router.use((req, res, next) => {
    console.log(`[VERIFICATION RESEND] Request received: ${req.method} ${req.originalUrl}`);
    next();
  });

  // Main route handler using router.use to match any HTTP method
  router.use('', async(req, res) => {
    try {
      console.log('[VERIFICATION RESEND] Verification email requested');

      const mUser = await req.user;
      
      // Check if user object exists
      if (!mUser || !mUser.id) {
        console.error('[VERIFICATION RESEND] User object is undefined or null');
        return App.json(res, false, App.t(['failed', 'to', 'get', 'user', 'data'], req.lang));
      }

      console.log(`[VERIFICATION RESEND] User ID: ${mUser.id}, Email: ${mUser.email}, IsEmailVerified: ${mUser.isEmailVerified}`);

      // Check if user already has verified email
      if (mUser.isEmailVerified) {
        console.log(`[VERIFICATION RESEND] User email already verified`);
        return App.json(res, false, App.t(['your', 'email', 'is', 'already', 'verified'], req.lang));
      }

      // Generate a new verification code
      const code = App.BCrypt.randomSecureToken(12);
      console.log(`[VERIFICATION RESEND] Generated new verification code`);

      // Create a new verification record
      const mEmailVerification = await App.getModel('EmailVerification').create({
        userId: mUser.id,
        email: mUser.email,
        code: code,
      });

      console.log(`[VERIFICATION RESEND] Created email verification record: ${mEmailVerification ? mEmailVerification.id : 'Failed'}`);

      if (!App.isObject(mEmailVerification) || !App.isPosNumber(mEmailVerification.id)) {
        console.error(`[VERIFICATION RESEND] Failed to create email verification record`);
        return App.json(res, false, App.t(['failed', 'to', 'create', 'email-verification'], req.lang));
      }

      // Send the verification email
      console.log(`[VERIFICATION RESEND] Preparing to send email to: ${mUser.email}`);

      const emailTemplate = await App.Mailer.createEmailTemplate('email-verification', {
        lang: req.lang,
        code: code,
        platform: 'web',
        webPath: App.toAppPath('web', 'client.email-verification-verify', code),
        timestamp: Date.now() // Add timestamp to prevent caching
      });

      console.log(`[VERIFICATION RESEND] Email template created: ${emailTemplate ? 'Yes' : 'No'}`);

      const sendRes = await App.Mailer.send({
        to: mUser.email,
        subject: App.t('email-verification', req.lang),
        data: emailTemplate
      });

      console.log(`[VERIFICATION RESEND] Email send result: ${JSON.stringify(sendRes)}`);

      if (!sendRes.success) {
        console.error(`[VERIFICATION RESEND] Failed to send email: ${sendRes.message}`);
        return App.json(res, false, App.t(sendRes.message, req.lang));
      }

      console.log(`[VERIFICATION RESEND] Email sent successfully`);
      return App.json(res, true, App.t([
        'we-have-sent-you-confirmation-email',
        'click-verify-email',
      ], req.lang, ' '));

    } catch (e) {
      console.error(`[VERIFICATION RESEND] Error:`, e);
      App.onRouteError(req, res, e);
    }
  });

  return { router, method: '', autoDoc: {} };
};
