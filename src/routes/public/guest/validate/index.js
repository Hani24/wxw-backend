const express = require('express');
const router = express.Router();

// POST /public/guest/validate
// Body: {
//   guestToken: "xxx"
// }
// Returns: {
//   valid: true/false,
//   expiresAt: "2025-10-17T...",
//   userId: 123,
//   clientId: 456
// }

module.exports = function(App, RPath) {
  router.use('', async (req, res) => {
    try {
      const data = req.getPost();
      const guestToken = req.getCommonDataString('guestToken', '');

      if (!guestToken || !guestToken.length) {
        return App.json(res, 417, App.t(['guest-token', 'is-required'], req.lang));
      }

      const mGuestSession = await App.getModel('GuestSession').getByToken(guestToken);

      if (!App.isObject(mGuestSession) || !App.isPosNumber(mGuestSession.id)) {
        return App.json(res, false, App.t(['guest', 'session', 'invalid', 'or', 'expired'], res.lang), {
          valid: false
        });
      }

      App.json(res, true, App.t('success', res.lang), {
        valid: true,
        expiresAt: mGuestSession.expiresAt,
        userId: mGuestSession.userId,
        clientId: mGuestSession.clientId,
        isConverted: mGuestSession.isConverted,
      });

    } catch (e) {
      console.log(e);
      App.onRouteError(req, res, e);
    }
  });

  return { router, method: 'post', autoDoc: {} };
};
