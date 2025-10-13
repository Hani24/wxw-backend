module.exports = ( App, express )=>{

  // [Custom-Strategy]
  express.use( async(req, res, next)=>{

    const isPrivateAccess = ( !! req.path.substr(0,10).trim().match(/^\/private/));

    // [default]
    req.lang = 'en';
    res.lang = 'en';

    // [common-auth]
    req.user = null;
    req.session = null;
    req.jwt = null;

    // [roles]
    req.client = null;
    req.courier = null;
    req.restaurant = null;
    req.manager = null;
    req.employee = null;
    req.admin = null;
    // req.root = {}; // not in use

    if( isPrivateAccess ){

      const header = req.getHeader('authorization');
      if( !header ){
        App.logger.warn(`[403]: middleware: [passport]: ${res.info.path} => ${res.info.ip}`);
        console.warn(` [403]: [${req.path}]: [${res.info.ip}]`)
        return App.json(res, 403, App.t(['forbidden','[hbt]'], req.lang));
      }

      const Bearer = (header.trim().split(' ').pop().toString()).trim();
      const jwt_t = await App.JWT.decode(Bearer);
      if( !App.isObject(jwt_t) || !App.isPosNumber(+jwt_t.userId) || !App.isString(jwt_t.token) ){
        App.logger.warn(`[403]: middleware: [0] [passport]: ${res.info.path} => ${res.info.ip}`);
        console.warn(` [403]: [0]: [${req.path}]: [${res.info.ip}]`)
        console.debug({Bearer});
        console.debug({jwt_t});
        return App.json(res, 403, App.t(['forbidden','[j]'], req.lang));
      }

      // validate {.role} in prod
      req.jwt = jwt_t;

      const mSession = await App.getModel('Session').getByFields({
        id: (+jwt_t.sessionId),
        userId: (+jwt_t.userId),
        token: jwt_t.token,
        isDeleted: false,
        // country: res.info.country,
        // timezone: res.info.timezone,
        // ip: res.info.ip,
      });

      if( !App.isObject(mSession) || !App.isPosNumber(mSession.id) ){
        App.logger.warn(`[401]: middleware: [1] [passport]: ${res.info.path} => ${res.info.ip}`);
        console.warn(` [401]: [1]: [${req.path}]: [${res.info.ip}]`)
        return App.json(res, 401, App.t(['not','authenticated','[s]'], req.lang));
      }

      // if( mSession.country !== res.info.country )
      //   console.debug(` [/private/]: Session: [country] does not match current request... `);

      // if( mSession.ip !== res.info.ip )
      //   console.debug(` [/private/]: Session: [ip] does not match current request... `);

      // if( mSession.timezone !== res.info.timezone )
      //   console.debug(` [/private/]: Session: [timezone] does not match current request... `);

      const mUser = await App.getModel('User').getById( jwt_t.userId );
      if( !App.isObject(mUser) || !App.isPosNumber(mUser.id) ){
        App.logger.warn(`[403]: middleware: [2] [passport]: ${res.info.path} => ${res.info.ip}`);
        console.warn(` [403]: [2]: [${req.path}]: [${res.info.ip}]`)
        return App.json(res, 403, App.t(['forbidden','[u]'], req.lang));
      }

      if( mUser.isDeleted || mUser.isRestricted /*|| !mUser.isVerified*/ )
        return App.json(res, 403, App.t(['forbidden','[main]'], req.lang));

      req.user = mUser;
      req.session = mSession;

      req.lang = mUser.lang;
      res.lang = mUser.lang;

      /* await */ mUser.update({
        timezone: (res.info.timezone || mUser.timezone || 'n/a'),
        lastSeenAt: App.getISODate(),
        lat: res.info.lat,
        lon: res.info.lon,
      });

      // console.json({
      //   lat: res.info.lat,
      //   lon: res.info.lon,
      // });

      // if( res.info.country && res.info.timezone ){
      //   // !!! [NON-BLOCKING]
      //   App.getModel('Profile').getByUserId( mUser.id )
      //     .then((mProfile)=>{
      //       if( App.isObject(mProfile) && App.isPosNumber(mProfile.id) ){
      //         mProfile.update({
      //           country: res.info.country, 
      //           timezone: res.info.timezone,
      //         }).catch((e)=>{})
      //       }
      //     }).catch((e)=>{});
      // }

    }else{

      // [public-routes] access with optional [user/client/courier] etc ... 

      // Try to get User info if JWT:Bearer is presented in the headers
      // [not-required]
      const header = req.getHeader('authorization');

      if( header ){
        const Bearer = (header.split(' ').pop().toString()).trim();
        const jwt_t = await App.JWT.decode(Bearer);
        if( App.isObject(jwt_t) && App.isPosNumber( +jwt_t.userId ) ){
          const mSession = await App.getModel('Session').getByFields({
            id: (+jwt_t.sessionId),
            userId: (+jwt_t.userId),
            token: jwt_t.token,
            isDeleted: false,
            // country: res.info.country,
            // timezone: res.info.timezone,
            // ip: res.info.ip,
          });

          if( App.isObject(mSession) && App.isPosNumber( +mSession.id ) ){

            // if( mSession.country !== res.info.country ){
            //   console.debug(` [/public/]: Session: [country] does not match current request... `);
            // }

            // if( mSession.ip !== res.info.ip ){
            //   console.debug(` [/public/]: Session: [ip] does not match current request... `);
            // }

            // if( mSession.timezone !== res.info.timezone ){
            //   console.debug(` [/public/]: Session: [timezone] does not match current request... `);
            // }

            const mUser = await App.getModel('User').getById( jwt_t.userId );
            if( App.isObject(mUser) && App.isPosNumber( mUser.id ) ){

              req.lang = mUser.lang;
              res.lang = mUser.lang;

              if( mUser.isDeleted || mUser.isRestricted /*|| !mUser.isVerified*/ ){
                // return App.json(res, 403, App.t(['forbidden'], req.lang));
                req.user = null;
                req.client = null;
                req.courier = null;
                req.session = null;
              }else{
                req.user = mUser;
                req.session = mSession;

                /* await */ 
                /*mUser.update({
                  timezone: (res.info.timezone || mUser.timezone || ''),
                  lastSeenAt: App.getISODate(),
                  lat: res.info.lat,
                  lon: res.info.lon,
                });*/ 
              }
            }

          }else{
            console.warn(` [${req.path}]: [${res.info.ip}] => jwt/session: wrong-data || no valid session`);
            console.debug({Bearer});
            console.debug({jwt_t});
          }

        }
      }

    }

    next();

  });

  return true;

}