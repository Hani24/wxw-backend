module.exports = (App, params={})=>{

  // const platforms = App.getModel('Session').getPlatforms({asArray: false});
  // platforms.android;
  // platforms.ios;
  // platforms.web;

  const UI_RESTAURANT_PROTODOMAIN = App.getEnv('UI_RESTAURANT_PROTODOMAIN');
  const UI_ADMIN_PANEL_PROTODOMAIN = App.getEnv('UI_ADMIN_PANEL_PROTODOMAIN');

  return {
    android: {
      public: {
        'open-restaurant': 'arr-morris://open-restaurant?id={0}',
      },
      google: {
        storeIcon: App.S3.getUrlByName('google.download-app.black.v1.png'),
        appLink: 'https://play.google.com/store/apps/details?id={0}',
      },
    },
    ios: {
      public: {
        'open-restaurant': 'arr-morris://open-restaurant?id={0}',
      },
      apple: {
        storeIcon: App.S3.getUrlByName('apple.download-app.black.v1.png'),
        appLink: 'https://apps.apple.com/us/app/{0}',
      },
    },
    web: {
      public: {
        'share-restaurant': '/public/share/restaurant/by/id/{0}',
        'get-privacy-policy': '/public/info/get/privacy-policy',
        'get-terms-and-conditions': '/public/info/get/terms-and-conditions',
        'view-privacy-policy': '/public/info/view/privacy-policy',
        'view-terms-and-conditions': '/public/info/view/terms-and-conditions',
      },
      client: {
        'email-verification-verify': '/public/client/email-verification/verify/code/{0}',
      },
      courier: {
        'email-verification-verify': '/public/courier/email-verification/verify/code/{0}',
      },
      stripe: {
        refresh: `/public/services/stripe/refresh/account/id/{0}`,
        return: `/public/services/stripe/return/account/id/{0}`,
      },
      restaurant: {
        // 'email-verification-request': '/public/restaurant/email-verification/request/code/{0}',
        'email-verification-verify': '/public/restaurant/email-verification/verify/code/{0}',
        'access-recovery-verify': `${UI_RESTAURANT_PROTODOMAIN}/change-password/code/{0}`,
      },
      admin: {
        // 'email-verification-request': '/public/admin/email-verification/request/code/{0}',
        'email-verification-verify': '/public/admin/email-verification/verify/code/{0}',
        'access-recovery-verify': `${UI_ADMIN_PANEL_PROTODOMAIN}/change-password/code/{0}`,
      },
    },
  };
};


