module.exports = ( App, express, name )=>{

  const privateCommonRegExp = new RegExp(`^\/private\/common*`,'i');
  const privateRestaurantRegExp = new RegExp(`^\/private\/restaurant*`,'i');

  const privateEmployeeOrders = new RegExp(`^\/private\/restaurant\/orders*`,'i');
  const privateEmployeeOrderRequests = new RegExp(`^\/private\/restaurant\/order-requests*`,'i');
  const privateEmployeeSetPassword = new RegExp(`^\/private\/restaurant\/settings\/security\/set-password*`,'i');
  const privateEmployeeLogout = new RegExp(`^\/private\/restaurant\/logout*`,'i');

  const roles = App.getModel('User').getRoles();

  // [access-type]
  express.use( async(req, res, next)=>{

    const isPrivateAccess = ( !! req.path.substr(0,10).trim().match(/^\/private/));

    // Check for restaurantId in query params
    const restaurantIdParam = req.query.restaurantId;
    let restaurantFromQuery = null;
    
    // Only process if restaurantId is a valid value (not undefined, null, or their string representations)
    if (restaurantIdParam && restaurantIdParam !== 'undefined' && restaurantIdParam !== 'null') {
      try {
        // Try to find the restaurant by ID
        restaurantFromQuery = await App.getModel('Restaurant').getByFields({ id: restaurantIdParam });
      } catch (err) {
        console.warn(`Failed to get restaurant with ID ${restaurantIdParam}: ${err.message}`);
      }
    }

    const mUser = await req.user;

    // // [roles]
    // req.user (common model)
    // req.client
    // req.courier
    // req.restaurant
    //   - req.manager (sub-roles: no-restrictions)
    //   - req.employee (sub-roles: with-restrictions)
    // req.admin

    // If a valid restaurant was found from the query param, use it
    if (restaurantFromQuery && App.isObject(restaurantFromQuery) && App.isPosNumber(restaurantFromQuery.id)) {
      req.restaurant = restaurantFromQuery;
      
      // If we're accessing restaurant-specific endpoints, get the user through the restaurant
      if (req.path.match(privateRestaurantRegExp)) {
        const restaurantUser = await App.getModel('User').getByFields({ 
          id: restaurantFromQuery.userId 
        });
        
        if (App.isObject(restaurantUser) && App.isPosNumber(restaurantUser.id)) {
          // Only update req.user if we have a valid user from the restaurant
          req.user = restaurantUser;
        }
      }
    }

    if( isPrivateAccess ){

      if( !App.isObject(mUser) || !App.isPosNumber(mUser.id) ){
        App.logger.warn(`[401]: middleware: [0m] [access-type]: ${req.path} => ${res.info.ip}`);
        console.warn(` [401]: [0m]: [${req.path}]: [${res.info.ip}]`)
        // return App.json(res, 401, App.t(['forbidden','[0m]'], req.lang));
        return App.json(res, 401, App.t(['not','authenticated','[0m]'], req.lang));
      }

      if( !req.path.match( new RegExp(`^\/private\/${mUser.role}*`,'i') ) ){
        // console.error(`[access:0]: [${mUser.role}] => on-route: ${req.path}`);

        // allow [auth-user*] access: [/private/common/*]
        if( !req.path.match( privateCommonRegExp ) ){
          // console.error(`[access:1]: [${mUser.role}] => on-common: ${req.path}`);

          // allow [resto/manager, admin] access [/private/restaurant/*]
          if( mUser.role === roles.manager || mUser.role === roles.admin ) {
            if( !req.path.match( privateRestaurantRegExp ) ){
              // console.error(`[access:2]: [${mUser.role}] => on-merged-roles: ${req.path}`);
              App.logger.warn(`[403]: middleware: [2] [access-type]: ${req.path} => ${res.info.ip}`);
              console.warn(` [403]: [1m]: [${req.path}]: [${res.info.ip}]`)
              return App.json(res, 403, App.t(['forbidden','[1m]'], req.lang));
            }
          }else if( mUser.role === roles.employee ){

            // https://interexy-com.atlassian.net/wiki/spaces/MAI/pages/221839615/R06.05+View+panel+functionality+based+on+role
            // [employee]: allow access oly to: 
            //   - [/private/restaurant/orders/*]
            //   - [/private/restaurant/order-requests/*]
            //   - [/private/restaurant/settings/security/set-password*]
            if( 
              !req.path.match(privateEmployeeOrders)
              &&
              !req.path.match(privateEmployeeOrderRequests)
              &&
              !req.path.match(privateEmployeeSetPassword)
              &&
              !req.path.match(privateEmployeeLogout)
            ){
              // console.error(`[access:2]: [${mUser.role}] => on-merged-roles: ${req.path}`);
              App.logger.warn(`[403]: middleware: [2] [access-type]: ${req.path} => ${res.info.ip}`);
              console.warn(` [403]: [2m]: [${req.path}]: [${res.info.ip}]`)
              return App.json(res, 403, App.t(['forbidden','[2m]'], req.lang));
            }

          }else{
            // console.error(`[access:3]: [${mUser.role}] => not-on-common/all*: ${req.path}`);
            return App.json(res, 403, App.t(['forbidden','[3m]'], req.lang));
          }

        }else{
          // all authenticated [users] are allowed to access [/private/common]
        }
      }

      // console.json({mUser});

      // Only set user role properties if we haven't set the restaurant from query params
      if (!restaurantFromQuery) {
        switch( mUser.role ){
          case roles.client: {

            // req.jwt.role;
            req.client = await App.getModel('Client').getByUserId( mUser.id );

            if( !App.isObject(req.client) || !App.isPosNumber(req.client.id) ){
              App.logger.warn(`[403]: middleware: [2] [access-type]: [client]: ${req.path} => ${res.info.ip}`);
              console.warn(` [403]: [2]: [client] [${req.path}]: [${res.info.ip}]`)
              return App.json(res, 403, App.t(['forbidden','[2*]'], req.lang));
            }

            if( req.client.isDeleted || req.client.isRestricted /*|| !req.client.isVerified*/ )
              return App.json(res, 403, App.t(['forbidden','[3]'], req.lang));

            // best guess based on ip, used to estimate/show distances to each resto on Mobile-App, no high precision is required
            // if( res.info.lat && res.info.lon ){
            //   req.user.update({
            //     lat: res.info.lat,
            //     lon: res.info.lon,
            //   });
            // }
            // /* await */ mUser.update({ lastSeenAt: App.getISODate() });
            break;
          }
          case roles.courier: {

            // req.jwt.role;
            req.courier = await App.getModel('Courier').getByUserId( mUser.id );

            if( !App.isObject(req.courier) || !App.isPosNumber(req.courier.id) || req.courier.isRestricted ){
              App.logger.warn(`[403]: middleware: [3] [access-type]: [courier]: ${req.path} => ${res.info.ip}`);
              console.warn(` [403]: [3]: [courier] [${req.path}]: [${res.info.ip}]`)
              return App.json(res, 403, App.t(['forbidden','[3*]'], req.lang));
            }

            if( req.courier.isDeleted || req.courier.isRestricted /*|| !req.courier.isVerified*/ )
              return App.json(res, 403, App.t(['forbidden','[4]'], req.lang));

            // dev only for GPS test, prod: updated view sockets with line coords
            // try set coords from IP-info if no data has been set by the app yet
            // to be able calculate approximately distances 
            console.log({courier: {lat: req.courier.lat, lon: req.courier.lon} });
            if((+req.courier.lat) === 0 && (+req.courier.lon) === 0){
              req.courier.update({
                lat: res.info.lat,
                lon: res.info.lon,
              }).then((c)=>{
                console.debug({courier: {lat: c.lat, lon: c.lon} });
              })
            }

            // req.courier.lastOnlineAt
            if( req.courier.isOnline ){
              /* await */ req.courier.update({
                lastOnlineAt: App.getISODate(),
              });
            }

            break;
          }
          case roles.restaurant: {

            // req.jwt.role;
            req.restaurant = await App.getModel('Restaurant').getByUserId( mUser.id );

            if( !App.isObject(req.restaurant) || !App.isPosNumber(req.restaurant.id) ){
              App.logger.warn(`[403]: middleware: [4] [access-type]: [restaurant]: ${req.path} => ${res.info.ip}`);
              console.warn(` [403]: [4]: [restaurant] [${req.path}]: [${res.info.ip}]`)
              return App.json(res, 403, App.t(['forbidden','[4*]'], req.lang));
            }

            if( req.restaurant.isDeleted || req.restaurant.isRestricted /*|| !req.restaurant.isVerified*/ )
              return App.json(res, 403, App.t(['forbidden','[5]'], req.lang));

            if( App.isNull(req.restaurant.timezone) || req.restaurant.timezone === 'n/a' ){
              req.restaurant.update({
                timezone: res.info.timezone,
              });
            }

            break;
          }
          case roles.manager: {

            // req.jwt.role;
            req.manager = await App.getModel('Manager').getByUserId( mUser.id );

            if( !App.isObject(req.manager) || !App.isPosNumber(req.manager.id) ){
              App.logger.warn(`[403]: middleware: [5] [access-type]: [manager]: ${req.path} => ${res.info.ip}`);
              console.warn(` [403]: [5]: [manager] [${req.path}]: [${res.info.ip}]`)
              return App.json(res, 403, App.t(['forbidden','[5*]'], req.lang));
            }

            if( req.manager.isDeleted || req.manager.isRestricted /*|| !req.manager.isVerified*/ )
              return App.json(res, 403, App.t(['forbidden','[6]'], req.lang));

            req.restaurant = await App.getModel('Restaurant').getByFields({ id: mUser.restaurantId });

            if( !App.isObject(req.restaurant) || !App.isPosNumber(req.restaurant.id) ){
              App.logger.warn(`[403]: middleware: [6] [access-type]: [restaurant/manager]: ${req.path} => ${res.info.ip}`);
              console.warn(` [403]: [6]: [restaurant/manager] [${req.path}]: [${res.info.ip}]`)
              return App.json(res, 403, App.t(['forbidden','[6*]'], req.lang));
            }

            if( req.restaurant.isDeleted || req.restaurant.isRestricted /*|| !req.restaurant.isVerified*/ )
              return App.json(res, 403, App.t(['forbidden','[7]'], req.lang));

            // /* await */ mUser.update({ lastSeenAt: App.getISODate() });

            break;
          }
          case roles.employee: {
            // req.jwt.role;
            req.employee = await App.getModel('Employee').getByUserId( mUser.id );

            if( !App.isObject(req.employee) || !App.isPosNumber(req.employee.id) ){
              App.logger.warn(`[403]: middleware: [7] [access-type]: [employee]: ${req.path} => ${res.info.ip}`);
              console.warn(` [403]: [7]: [employee] [${req.path}]: [${res.info.ip}]`)
              return App.json(res, 403, App.t(['forbidden','[7*]'], req.lang));
            }

            if( req.employee.isDeleted || req.employee.isRestricted /*|| !req.employee.isVerified*/ )
              return App.json(res, 403, App.t(['forbidden','[8]'], req.lang));

            req.restaurant = await App.getModel('Restaurant').getByFields({ id: mUser.restaurantId });

            if( !App.isObject(req.restaurant) || !App.isPosNumber(req.restaurant.id) ){
              App.logger.warn(`[403]: middleware: [8] [access-type]: [restaurant/employee]: ${req.path} => ${res.info.ip}`);
              console.warn(` [403]: [8]: [restaurant/employee] [${req.path}]: [${res.info.ip}]`)
              return App.json(res, 403, App.t(['forbidden','[8*]'], req.lang));
            }

            if( req.restaurant.isDeleted || req.restaurant.isRestricted /*|| !req.restaurant.isVerified*/ )
              return App.json(res, 403, App.t(['forbidden','[9]'], req.lang));

            // /* await */ mUser.update({ lastSeenAt: App.getISODate() });

            break;
          }
          case roles.admin: {
            // req.jwt.role;

            if( App.isPosNumber(mUser.restaurantId) ){
              req.restaurant = await App.getModel('Restaurant').getByFields({ id: mUser.restaurantId });

              if( !App.isObject(req.restaurant) || !App.isPosNumber(req.restaurant.id) ){
                App.logger.warn(`[404]: middleware: [9] [access-type]: [admin/restaurant:${mUser.restaurantId}]: ${req.path} => ${res.info.ip}`);
                console.warn(` [404]: [9]: [admin/restaurant:${mUser.restaurantId}] [${req.path}]: [${res.info.ip}]`)
                return App.json(res, 404, App.t(['restaurant',mUser.restaurantId,'not-found'], req.lang));
              }

              // allow access it anyway ?
              // if( req.restaurant.isDeleted || req.restaurant.isRestricted || !req.restaurant.isVerified )
              //   return App.json(res, 403, App.t(['forbidden','[10]'], req.lang));

            }

            break;
          }
          case roles.root: {
            // req.jwt.role;
            break;
          }
        }
      }

    }else{

      if( App.isObject(mUser) && App.isPosNumber(mUser.id) ){
        switch( mUser.role ){
          case roles.manager: {
            req.manager = await App.getModel('Manager').getByUserId( mUser.id );
            if( App.isObject(req.manager) && App.isPosNumber(req.manager.id) )
            if( req.manager.isDeleted || req.manager.isRestricted /*|| !req.manager.isVerified*/ )
              req.manager = null;
            break;
          }
          case roles.employee: {
            req.employee = await App.getModel('Employee').getByUserId( mUser.id );
            if( App.isObject(req.employee) && App.isPosNumber(req.employee.id) )
            if( req.employee.isDeleted || req.employee.isRestricted /*|| !req.employee.isVerified*/ )
              req.employee = null;
            break;
          }
          case roles.client: {
            req.client = await App.getModel('Client').getByUserId( mUser.id );
            if( App.isObject(req.client) && App.isPosNumber(req.client.id) )
            if( req.client.isDeleted || req.client.isRestricted /*|| !req.client.isVerified*/ )
              req.client = null;
            break;
          }
          case roles.courier: {
            req.courier = await App.getModel('Courier').getByUserId( mUser.id );
            if( App.isObject(req.courier) && App.isPosNumber(req.courier.id) )
            if( req.courier.isDeleted || req.courier.isRestricted /*|| !req.courier.isVerified*/ )
              req.courier = null;
            break;
          }
          // case roles.restaurant: {
          //   req.restaurant = await App.getModel('Restaurant').getByUserId( mUser.id );
          //   if( App.isObject(req.restaurant) && App.isPosNumber(req.restaurant.id) )
          //   if( req.restaurant.isDeleted || req.restaurant.isRestricted /*|| !req.restaurant.isVerified*/ )
          //     req.restaurant = null;
          //   break;
          // }
          // case roles.admin: {
          //   if( App.isPosNumber(mUser.restaurantId) ){
          //     req.restaurant = await App.getModel('Restaurant').getByFields({ id: mUser.restaurantId });
          //     // if( App.isObject(req.restaurant) && App.isPosNumber(req.restaurant.id) )
          //     // if( req.restaurant.isDeleted || req.restaurant.isRestricted /*|| !req.restaurant.isVerified*/ )
          //     //   req.restaurant = null;              
          //   }
          //   break;
          // }
        }
      }
    }

    next();

  });

  return true;

}
