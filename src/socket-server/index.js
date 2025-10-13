const SocketServerBase = require('./SocketServerBase');

class SocketServer extends SocketServerBase{

  constructor( App, params={} ){
    super(App, params);
  }

  _initRestaurantsHandler(){

    const self = this;
    try{

      self.getIo().on('connection', (ws)=>{
        try{
          const HS = ws.handshake;
          const {time, address, xdomain, secure, query, issued} = HS;
          const headers = HS.headers; // ws.request.headers 
          // const ip = address || headers['x-real-ip'] || headers['x-forwarded-for'] || false;
          const ip = headers['x-real-ip'] || headers['x-forwarded-for'] || false;
          const port = headers['x-real-port'] || headers['x-forwarded-port'] || false;
          const id = ws.id || ws.socketId || false;

          // if: applicable ?
          // ws.handshake.auth; // prints { token: "abcd" }

          // if( self.App.getEnv('dev') || self.debug() )
          //   console.debug(` #${self.name}: connection: ${id}: [${ip}:${port}]`);

          ws.info = {
            isAuth: false,
            restaurantId: false,
            userId: false,
            lang: 'en',
          };

          ws.on('authenticate', async (data)=>{
            try{

              data.ip = ip;

              const authRestaurantRes = await self._authenticateRestaurant( data, id );
              // console.json({authRestaurantRes})
              if( !authRestaurantRes.success ){
                if( self.debug() ){
                  // console.warn(` #${self.name}: authenticate-restaurant: `);
                  // console.error(`   e: ${authRestaurantRes.message}`);
                  // console.debug(`   d: `, authRestaurantRes.data);                  
                }

                await console.sleep(2000);
                // console.json({authRestaurantRes});
                const emitRes = await self.emitToSocketId( id, 'authenticate', authRestaurantRes );
                // ws.disconnect( true );
                return;
              }

              ws.on("disconnect", (reason) => {
                console.warn(` #${self.name}: [on]:disconnect: (restaurant) `);
                // console.json({reason});
                // self.onRestaurantDisconnect( ws );
              });

              ws.on("disconnecting", (reason) => {
                // console.debug(` #${self.name}: [on]:disconnecting: `);
                // console.json({reason});
                // console.json({rooms: ws.rooms});
                // self.onRestaurantDisconnect( ws );
              });

              // ws.onAny((event, data={}) => {
              //   console.debug(` #${self.name}: restaurant:[on]:onAny: (${event||'evt'}) ${'...'}`);
              //   console.log({data});
              //   console.log({ws: ws.info});
              // });

              await self.emitToSocketId( id, 'authenticate', {
                success: true, 
                message: 'authenticated',
                data: authRestaurantRes.data,
              });

              // await console.sleep(1000);
              // await self.emitToSocketId( id, 'info', {
              //   system: self.App.getSystemInfo(),
              // });

            }catch(e){
              console.error(` #${self.name}:[on]:authenticate: ${e.message}`);

              try{
                await console.sleep(2000);
                await self.emitToSocketId( id, 'authenticate', {
                  success: false, 
                  message: ['failed-to','authenticate'],
                  data: {},
                });

                // ws.disconnect( true );
              }catch(e){
                console.error(` #${self.name}:[on]:authenticate:[error-notification]: ${e.message}`);
              }

            }
          });

        }catch(e){
          console.error(` #${self.name}:connection: ${e.message}`);
        }
      });
    }catch(e){
      console.error(` #${self.name}:_initRestaurantHandler: ${e.message} `);
      console.log(e.stack);
      // process.exit();
    }
  }

  async _authenticateRestaurant( data, id ){
    try{

      const mAuthRes = await this._authenticateCommonUser(data, id);
      if( !mAuthRes.success ){
        // console.debug({restaurant:{mAuthRes}});
        return mAuthRes;
      }

      const {mUser, mSession /*, jwt_t*/} = mAuthRes.data; 

      if( !this.getAllowedRestaurantRoles().includes( mUser.role ) ){
        // console.json({mUser});
        return {success: false, message: ['forbidden','[s:nvr]'], data:{
          userId: mUser.id,
          role: mUser.role,
          restaurantId: (mUser.restaurantId || 'n/a'),
        }}; // not-valid-role
      }

      const whereResto = {
        isVerified: true,
        isRestricted: false,
        isDeleted: false,
      };

      if( mUser.role === this.getRoles().restaurant ){
        // [restaurant] owner
        whereResto.userId = mUser.id;        
      }else{

        const roles = this.getRoles();

        if(
          [ roles.admin, roles.manager, roles.employee ].includes( mUser.role )
          &&
          this.App.isPosNumber(mUser.restaurantId)
        ){
          // [restaurant] super-admin/worker/employee
          whereResto.id = mUser.restaurantId;
        }else{
          return {success: false, message: ['forbidden','[s:nvrp]'], data: {
            userId: mUser.id,
            role: mUser.role,
            restaurantId: (mUser.restaurantId || 'n/a'),
          }}; // not-valid-role pass
        }

      }

      const mRestaurant = await this.App.getModel('Restaurant').findOne({
        where: whereResto,
        attributes: ['id','name']
      });

      if( !this.App.isObject(mRestaurant) || !this.App.isPosNumber(mRestaurant.id) ){
        // return {success: false, message: `server error: could not get related Restaurant`};
        return {success: false, message: ['forbidden','[s:rnf]'], data: {
          userId: mUser.id,
          role: mUser.role,
          restaurantId: (mUser.restaurantId || 'n/a'),
          whereResto,
        }};
      }

      const ws = this.getSocketById(id);

      ws.info = {
        isAuth: true,
        restaurantId: mRestaurant.id,
        userId: mUser.id,
        lang: mUser.lang,
      };

      if( !this.isExistingRestaurantId(mRestaurant.id) ){
        this.getRestaurants()[ mRestaurant.id ] = {
          sockets: {},
        };
      }

      this.getRestaurants()[ mRestaurant.id ].sockets[ id ] = true; // { ws };

      if( !this.isExistingUserId(mUser.id) ){
        this.getUsers()[ mUser.id ] = {
          sockets: {},
        };
      }

      this.getUsers()[ mUser.id ].sockets[ id ] = true; // { ws };

      // console.json({
      //   restaurant: {
      //     'this.getUsers()': this.getUsers(),
      //     'this.getClients()': this.getClients(),
      //     'this.getRestaurants()': this.getRestaurants(),
      //     'this.getRestaurantById()': this.getRestaurantById(mRestaurant.id),          
      //     'this.getUserById()': this.getUserById(mUser.id),          
      //   }
      // });

      console.ok(
        ` #${this.name}:_authenticateRestaurant: ${console.B('user')}: ${console.Y(`${mUser.id}:${mUser.role}`)}, `
        +`${console.B('restaurant')}: ${console.R(`${mRestaurant.id}:${mRestaurant.name}`)}, `
        +`${console.B('ip')}: ${console.R(`${data.ip}`)}`
      );

      // console.json({restoWsInfo: ws.info});

      return {
        success: true, 
        message: `authenticated`, 
        data: {
          isAuth: true,
          restaurantId: mRestaurant.id,
          userId: mUser.id,
          role: mUser.role,
          lang: mUser.lang,
        }
      };

    }catch(e){
      console.error(` #${this.name}:_authenticateRestaurant: ${e.message}`);
      return {success: false, message: `authentication server error`, data:{}};
    }
  }

  _initClientsHandler(){
    const self = this;
    try{

      self.getIo().on('connection', (ws)=>{
        try{
          const HS = ws.handshake;
          const {time, address, xdomain, secure, query, issued} = HS;
          const headers = HS.headers; // ws.request.headers 
          // const ip = address || headers['x-real-ip'] || headers['x-forwarded-for'] || false;
          const ip = headers['x-real-ip'] || headers['x-forwarded-for'] || false;
          const port = headers['x-real-port'] || headers['x-forwarded-port'] || false;
          const id = ws.id || ws.socketId || false;

          if( self.App.getEnv('dev') || self.debug() )
            console.debug(` #${self.name}: connection: ${id}: [${ip}:${port}]`);

          ws.info = {
            isAuth: false,
            clientId: false,
            userId: false,
            lang: 'en',
          };

          ws.on('test-me', (coords) => {
            console.error(`#${this.name}:on:${'test-me'}`);
            console.json({ coords: coords });
            console.json({ info: ws.info });            
          });

          ws.on('authenticate-client', async (data)=>{
            try{

              data.ip = ip;
              // console.json({'authenticate-client': data});
              const authClientRes = await self._authenticateClient( data, id );

              // console.json({authClientRes})
              if( !authClientRes.success ){
                if( self.debug() ){
                  console.warn(` #${self.name}: authenticate-client: `);
                  console.error(`   e: ${authClientRes.message}`);
                  console.debug(`   d: `, authClientRes.data);                  
                }

                await console.sleep(2000);
                // console.json({authClientRes});
                const emitRes = await self.emitToSocketId( id, 'authenticate-client', authClientRes );
                // ws.disconnect( true );
                return;
              }

              ws.on("disconnect", (reason) => {
                console.warn(` #${self.name}: [on]:disconnect: (client) `);
                // console.json({reason});
                // self.onClientDisconnect( ws );
              });

              ws.on("disconnecting", (reason) => {
                // console.debug(` #${self.name}: [on]:disconnecting: `);
                // console.json({reason});
                // console.json({rooms: ws.rooms});
                // self.onClientDisconnect( ws );
              });

              // console.error(`event: [${self.App.getModel('Client').getEvents().livePositionOfCourierUpdated}]`);
              ws.on(self.App.getModel('Client').getEvents().livePositionOfCourierUpdated, async (coords)=>{
                try{

                  // console.error(`#${self.name}:on:${self.App.getModel('Client').getEvents().livePositionOfCourierUpdated}`);
                  // console.debug({coords});

                  if( !ws.info.isAuth || !ws.info.courierId )
                    return console.debug(`set:coords: not-authenticated | not courier`);

                  if( !self.App.isObject(coords) )
                    return console.debug(`set:coords: lat/lon: is not valid object`);

                  const validateCoordsRes = self.App.geo.lib.isValidCoords( coords );
                  if( !validateCoordsRes.success ){
                    console.error(`set:coords: validate error: ${validateCoordsRes.message}`);
                    return console.json({validateCoordsRes, coords});
                  }

                  const {lat, lon} = validateCoordsRes.data;

                  let mCourier = await self.App.getModel('Courier').findOne({
                    where: {
                      id: ws.info.courierId,
                    },
                    attributes: ['id','lat','lon','hasActiveOrder','activeOrderId'],
                  });

                  // console.json({
                  //   c: {lat: mCourier.lat, lon: mCourier.lon},
                  //   n: {lat: lat, lon: lon },
                  //   same: lat === mCourier.lat && lon === mCourier.lon,
                  // });

                  if(
                    (!self.App.isObject(mCourier) || !self.App.isPosNumber(mCourier.id) )
                    ||
                    ( mCourier.lat === lat && mCourier.lon === lon )
                  ) return console.debug(`set:coords: lat/lon: same position`);

                  mCourier = await mCourier.update({lat, lon});
                  if(!self.App.isObject(mCourier) || !self.App.isPosNumber(mCourier.id) )
                    return console.error(`Server Error: could not update geo-position`);

                  if( !mCourier.hasActiveOrder )
                    return console.debug(`set:coords: lat/lon: no active order`);

                  const mOrder = await self.App.getModel('Order').findOne({
                    where: {
                      id: mCourier.activeOrderId,
                      status: self.App.getModel('Order').getStatuses().processing,
                    },
                    attributes: ['id','clientId'],
                  });

                  if( self.App.isObject(mOrder) && self.App.isPosNumber(mOrder.id) && self.App.isPosNumber(mOrder.clientId) ){

                    const emitCourierPositionToClientRes = await self.broadcastToClientByClientId(
                      mOrder.clientId, 
                      self.App.getModel('Client').getEvents().livePositionOfCourierUpdated, 
                      { lat, lon }
                    );
                    if( !emitCourierPositionToClientRes.success ){
                      console.error(`emitCourierPositionToClientRes: ${emitCourierPositionToClientRes.message}`);
                    }else{
                      console.ok(` #${self.name}: emit to to client: `);
                    }
                  }else{
                    console.warn(` #${self.name}: not active order`);
                  }

                }catch(e){
                  console.error(` #${self.name}:[on]:live-position-of-courier-updated: ${e.message}`);
                }

                return false;

              });

              // ws.onAny((event, data) => {
              //   console.line();
              //   console.debug(` #${self.name}: client:[on]:onAny: (${event || 'evt'})`);
              //   console.log({data});
              //   console.log({ws: ws.info});
              //   console.warn({user: this.getUserById( ws.info.userId )});
              //   console.warn({client: this.getClientById( ws.info.clientId )});
              //   console.warn({courier: this.getCourierById( ws.info.courierId )});
              // });

              await self.emitToSocketId( id, 'authenticate-client', {
                success: true, 
                message: 'authenticated',
                data: authClientRes.data,
              });

              // await console.sleep(1000);
              // await self.emitToSocketId( id, 'info', {
              //   system: self.App.getSystemInfo(),
              // });

            }catch(e){
              console.error(` #${self.name}:[on]:authenticate-client: ${e.message}`);

              try{
                await console.sleep(2000);
                await self.emitToSocketId( id, 'authenticate-client', {
                  success: false, 
                  message: ['failed-to','authenticate'],
                  data: {},
                });

                // ws.disconnect( true );
              }catch(e){
                console.error(` #${self.name}:[on]:authenticate-client:[error-notification]: ${e.message}`);
              }

            }
          });

        }catch(e){
          console.error(` #${self.name}:connection: ${e.message}`);
        }
      });
    }catch(e){
      console.error(` #${self.name}:_initClientsHandler: ${e.message} `);
      console.log(e.stack);
      // process.exit();
    }
  }

  async _authenticateClient( data, id ){
    try{

      const mAuthRes = await this._authenticateCommonUser(data, id);
      if( !mAuthRes.success ){
        console.debug({client:{mAuthRes}});
        return mAuthRes;
      }

      const {mUser, mSession /*, jwt_t*/} = mAuthRes.data; 
      const roles = this.getRoles();

      if( ![roles.client, roles.courier].includes(mUser.role) ){
        // not-valid-role
        return {success: false, message: ['forbidden','[s:nvr]'], data: {
          userId: mUser.id,
          role: mUser.role,
        }};
      }

      const mCourier = mUser.role !== roles.courier 
        ? false
        : await this.App.getModel('Courier').findOne({
          where: {
            userId: mUser.id,
            // isVerified: true,
            isRestricted: false,
            isDeleted: false,
          },
          attributes: ['id']
        });

      const mClient = mUser.role !== roles.client 
        ? false
        : await await this.App.getModel('Client').findOne({
          where: {
            userId: mUser.id,
            // isVerified: true,
            isRestricted: false,
            isDeleted: false,
          },
          attributes: ['id']
        });

      const clientId = (this.App.isObject(mClient) && this.App.isPosNumber(mClient.id) ? mClient.id : false);
      const courierId = (this.App.isObject(mCourier) && this.App.isPosNumber(mCourier.id) ? mCourier.id : false);

      if( (!clientId) && (!courierId) ){
        // record not found
        return {success: false, message: ['forbidden','[s:rnf]'], data: {
          userId: mUser.id,
          role: mUser.role,
          clientId,
          courierId,
        }};
      }

      const ws = this.getSocketById(id);

      ws.info = {
        isAuth: true,
        clientId,
        courierId,
        userId: mUser.id,
        lang: mUser.lang,
      };

      if( !this.isExistingUserId(mUser.id) ){
        this.getUsers()[ mUser.id ] = { sockets: {} };
      }

      this.getUsers()[ mUser.id ].sockets[ id ] = true; // { ws };

      if( clientId ){
        if( !this.isExistingClientId(clientId) ){
          this.getClients()[ clientId ] = { sockets: {} };
        }
        this.getClients()[ clientId ].sockets[ id ] = true; // { ws };
      }

      if( courierId ){
        if( !this.isExistingCourierId(courierId) ){
          this.getCouriers()[ courierId ] = { sockets: {} };
        }
        this.getCouriers()[ courierId ].sockets[ id ] = true; // { ws };
      }

      console.ok(
        ` #${this.name}:_authenticateClient: ${console.B('user')}: ${console.Y(`${mUser.id}:${mUser.role}:${mUser.email}`)}, `
        +`${console.B('client')}: ${console.R(`${clientId}`)}, `
        +`${console.B('courier')}: ${console.R(`${courierId}`)}, `
        +`${console.B('ip')}: ${console.R(`${data.ip}`)}`
      );

      // console.json({clientWsInfo: ws.info});

      // console.json({
      //   client: {
      //     'this.getUsers()': this.getUsers(),
      //     'this.getClients()': this.getClients(),
      //     'this.getClientById()': this.getClientById(mClient.id),
      //     'this.getUserById()': this.getUserById(mUser.id),          
      //   }
      // });

      return {
        success: true, 
        message: `authenticated`, 
        data: {
          isAuth: true,
          clientId: clientId,
          courierId: courierId,
          userId: mUser.id,
          role: mUser.role,
          lang: mUser.lang,          
        }
      };

    }catch(e){
      console.error(` #${this.name}:_authenticateClient: ${e.message}`);
      return {success: false, message: `authentication server error`, data:{}};
    }
  }


  // _initCouriersHandler(){}
}

module.exports = ( App, params={} ) => {
  return new SocketServer( App, params );

}
