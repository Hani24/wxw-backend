const express = require('express');
const router = express.Router();

// POST /public/guest/init
// Body: {
//   deviceId: "optional"
// }
// Returns: {
//   guestToken: "xxx",
//   expiresAt: "2025-10-17T...",
//   userId: 123,
//   clientId: 456
// }

module.exports = function(App, RPath) {
  router.use('', async (req, res) => {
    try {
      const data = req.getPost();
      const deviceId = req.getCommonDataString('deviceId', '');

      console.log('Guest init request:', {deviceId, ip: res.info.ip});

      // Create guest session
      const result = await App.getModel('GuestSession').createGuestSession({
        deviceId,
        ip: res.info.ip || 'n/a',
        country: res.info.country || 'n/a',
        timezone: res.info.timezone || 'n/a',
      });

      if (!result.success) {
        console.error('Failed to create guest session:', result.message);
        return App.json(res, 417, App.t(result.message, req.lang));
      }

      console.log('Guest session created successfully:', {
        guestToken: result.data.guestToken.substr(0, 10) + '...',
        userId: result.data.userId,
        clientId: result.data.clientId,
      });

      App.json(res, true, App.t('success', res.lang), result.data);

    } catch (e) {
      console.log(e);
      App.onRouteError(req, res, e);
    }
  });

  return { router, method: 'post', autoDoc: {} };
};
