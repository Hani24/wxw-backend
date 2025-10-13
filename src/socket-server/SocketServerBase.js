const logger = require('mii-logger.js');
const SocketIo = require('socket.io');

const consoleColors = require('./virtualConsoleColors');
const CONNECTION_ERRORS = require('./CONNECTION_ERRORS');

module.exports = SocketServerBase = class SocketServerBase {

  #config = {};
  #roles = [];
  #restaurants = {};
  #users = {};
  #couriers = {};
  #clients = {};
  #io = null;
  #isReady = false;
  #allowedRestaurantRoles = []; // manager, employee, owner, super-admin etc ...
  #params = {};

  constructor(App, params = {}) {

    this.App = App;
    this.name = 'socket-server';
    this.#config = {};
    this.#roles = [];
    this.#restaurants = {};
    this.#users = {};
    this.#couriers = {};
    this.#clients = {};
    this.#io = null;
    this.#isReady = false;
    this.#allowedRestaurantRoles = [];
    this.#params = params;
    this._init();

  }

  isReady() { return this.#isReady; };
  getIo() { return this.#io; };
  getAllowedRestaurantRoles() { return [...this.#allowedRestaurantRoles]; }
  getRoles() { return console.deepClone(this.#roles); }
  debug() { return ((!!this.#config.debug) || (!!this.#config.socket.debug)); }
  getRestaurants() { return this.#restaurants; }
  getUsers() { return this.#users; }
  getClients() { return this.#clients; }
  getCouriers() { return this.#couriers; }

  getConfig(asPointer = false) {
    return (asPointer ? this.#config : console.deepClone(this.#config));
  }

  getRoom(room = '/') {
    return this.#io.of(room);
  }

  isExistingSocketId(socketId, room = '/') {
    if (!this.isReady()) return false;
    return (!!this.getRoom(room).sockets.get(socketId));
  }

  getSocketById(socketId, room = '/') {
    return (this.isReady() && this.isExistingSocketId(socketId, room))
      ? this.getRoom(room).sockets.get(socketId) // ? this.getRoom( room ).sockets[ socketId ]
      : false;
  }

  isExistingUserId(userId) {
    if (!this.isReady()) return false;
    return (!!this.#users.hasOwnProperty(userId));
  }

  getUserById(userId) {
    return (this.isReady() && this.isExistingUserId(userId))
      ? this.#users[userId]
      : false;
  }

  isExistingClientId(clientId) {
    if (!this.isReady()) return false;
    return (!!this.#clients.hasOwnProperty(clientId));
  }

  getClientById(clientId) {
    return (this.isReady() && this.isExistingClientId(clientId))
      ? this.#clients[clientId]
      : false;
  }

  isExistingCourierId(courierId) {
    if (!this.isReady()) return false;
    return (!!this.#couriers.hasOwnProperty(courierId));
  }

  getCourierById(courierId) {
    return (this.isReady() && this.isExistingCourierId(courierId))
      ? this.#couriers[courierId]
      : false;
  }

  isExistingRestaurantId(restaurantId) {
    if (!this.isReady()) return false;
    return (!!this.#restaurants.hasOwnProperty(restaurantId));
  }

  getRestaurantById(restaurantId) {
    return this.isExistingRestaurantId(restaurantId)
      ? this.#restaurants[restaurantId]
      : false;
  }

  // const ids = await io.allSockets(); // == io.of("/").sockets
  // const socketCount = io.of("/").sockets.size;
  // const sockets = await io.fetchSockets();
  // const sockets = await io.of("/admin").fetchSockets(); 
  // const count = io.engine.clientsCount;
  // // may or may not be similar to the count of Socket instances in the main namespace, depending on your usage
  // const count2 = io.of("/").sockets.size;

  _initConfig() {

    if (this.isReady()) return this.#config;
    this.#params = console.deepClone(this.App.isObject(this.#params) ? this.#params : {});
    // console.json({'#params': this.#params});
    this.#config = {
      ...this.#params,
      socket: {
        ...(this.App.isObject(this.#params.socket) ? this.#params.socket : {}),
      },
      virtualConsole: {
        ...(this.App.isObject(this.#params.virtualConsole) ? this.#params.virtualConsole : {}),
      }
    };

    // console.json( this.#config );
    if (this.debug())
      console.json({ socket: { '#config': this.#config } });

    return this.#config;
  }


  async _init() {

    const self = this;

    try {

      console.line();
      console.info(` #${this.name}:_init`);

      if (this.App.isDaemon())
        return console.debug(` #${this.name}: App is-daemon: aborting ...`);

      this.#isReady = false;
      this._initConfig();

      if (!this.getConfig(true).enabled)
        return console.warn(` #${this.name}:_init: is not enabled`);

      this.#roles = this.App.getModel('User').getRoles();
      this.#allowedRestaurantRoles = [
        this.#roles.admin, this.#roles.restaurant, this.#roles.manager, this.#roles.employee
      ];

      self.#io = SocketIo(self.App.server, {
        ...self.getConfig(true).socket,
        // allowRequest: (req, callback) => {
        //   const isOriginValid = check(req);
        //   callback(null, isOriginValid);
        // },
        cors: {
          origin: '*',
          // [
          //   `api.${self.App.getEnv('DOMAIN')}`,
          //   `restaurant.${self.App.getEnv('DOMAIN')}`,
          // ],
          methods: ["GET", "POST", 'OTIONS'],
        },
        // allowRequest: (req, callback)=>{
        //   // console.log(`req:`);
        //   // logger.log(req);
        //   callback(null, true);
        // },
      });

      // As of socket.io@4.1.0, the Engine.IO server emits three special events:

      // will be emitted just before writing the response headers of the first HTTP request 
      // of the session (the handshake), allowing you to customize them.
      self.#io.engine.on('initial_headers', (headers, req) => {
        try {
          // headers["test"] = "123";
          // headers["set-cookie"] = "mycookie=456";
        } catch (e) {
          console.error(` #${self.name}:io.engine:initial_headers: ${e.message}`);
          console.json({ headers });
        }
      });

      // will be emitted just before writing the response headers of each HTTP request of the session 
      // (including the WebSocket upgrade), allowing you to customize them.
      self.#io.engine.on('headers', (headers, req) => {
        try {
          // headers["test"] = "789";
        } catch (e) {
          console.error(` #${self.name}:io.engine:headers: ${e.message}`);
          console.json({ headers });
        }
      });

      // will be emitted when a connection is abnormally closed
      self.#io.engine.on('connection_error', (err) => {
        try {
          // *** => enble in debug mode: console.warn(` #${self.name}:io.engine:connection_error: `);
          // *** => enble in debug mode: console.warn(`   code: ${err.code} `);
          // *** => enble in debug mode: console.warn(`   message: ${err.message} `);
          // logger.log('req:', err.req);      // the request object
          // logger.log('code:', err.code);     // the error code, for example 1
          // logger.log('message:', err.message);  // the error message, for example "Session ID unknown"
          // logger.log('context:', err.context);  // some additional error context
        } catch (e) {
          console.error(` #${self.name}:io.engine:connection_error: ${e.message}`);
        }
      });

      this._initRestaurantsHandler();
      // this._initCouriersHandler();
      this._initClientsHandler();

      this.#isReady = true;
      console.ok(` #${self.name}: => ready`);
      self.App.emit('socket-server-is-ready');

      this._initVirtualConsole();

    } catch (e) {
      console.error(` #${this.name}:_init: ${e.message} `);
      console.log(e.stack);
      // process.exit();
    }
  }

  async _authenticateCommonUser(data, id) {

    try {

      // console.log('@authenticate');
      // console.log({data, id});

      if (!this.App.isObject(data) || !this.App.isString(data.token))
        return { success: false, message: ['forbidden', '[s:atnf]'], data: {} }; // auth token not found

      const { token } = data;

      const jwt_t = await this.App.JWT.decode(token);
      // console.json({jwt_t});
      if (!this.App.isObject(jwt_t) || !this.App.isPosNumber(+jwt_t.userId) || !this.App.isString(jwt_t.token))
        return { success: false, message: ['forbidden', '[s:nvat]'], data: { token: `${token.substr(0, 12)}...` } }; // no valid auth token

      const mSession = await this.App.getModel('Session').findOne({
        where: {
          id: (+jwt_t.sessionId),
          userId: (+jwt_t.userId),
          token: jwt_t.token,
          isDeleted: false,
        },
        attributes: ['id', 'userId'],
      });

      if (!this.App.isObject(mSession) || !this.App.isPosNumber(mSession.id)) {
        // console.json({token, jwt_t});
        return {
          success: false, message: ['forbidden', '[s:snv]'], data: {
            userId: ((+jwt_t.userId) || 'n/a'),
            sessionId: ((+jwt_t.sessionId) || 'n/a'),
            role: (jwt_t.role || 'n/a'),
            token: `${(jwt_t.token || 'n/a').substr(0, 12)}...`,
          }
        }; // session not valid / not found
      }

      const mUser = await this.App.getModel('User').findOne({
        where: {
          id: mSession.userId,
          isRestricted: false,
          isDeleted: false,
          // role: this.#roles.restaurant,
        },
        attributes: ['id', 'lang', 'role', 'restaurantId', 'email'],
      });

      if (!this.App.isObject(mUser) || !this.App.isPosNumber(mUser.id))
        return {
          success: false, message: `user not found and / or account has been restricted/deleted`, data: {
            userId: ((+jwt_t.userId) || 'n/a'),
            sessionId: ((+jwt_t.sessionId) || 'n/a'),
            role: (jwt_t.role || 'n/a'),
          }
        };

      return {
        success: true, message: 'authenticated', data: {
          mUser, mSession, jwt_t
        }
      };

    } catch (e) {
      console.error(` #${this.name}:_authenticateCommonUser: ${e.message}`);
      console.log(e.stack || []);
      return { success: false, message: 'Failed to authenticate' };
    }

  }

  async emitToSocketId(socketId, event, data = {}, ack = false) {

    // console.log('@emitToSocketId:');
    // console.log({socketId, event, data, ack});

    const self = this;

    try {

      if (!this.isReady())
        return { success: false, message: `not ready` };

      if (!this.isExistingSocketId(socketId))
        return { success: false, message: `unknown socket-id: [${socketId}]` };

      let res = false;

      if (data.message) {
        data.message = this.App.t(data.message, this.getSocketById(socketId).info.lang);
      }

      if (self.App.isFunction(ack)) {

        res = await (this.getSocketById(socketId).emit(event, data, (ackRes) => {
          // console.log({ackRes});
          try {
            ack(ackRes);
          } catch (e) {
            console.error(` #${this.name}:emitToSocketId: [ack]: ${e.message}`);
          }
        }));

      } else {
        res = await (this.getSocketById(socketId).emit(event, data));
      }

      return { success: res, message: res ? `success` : 'failed' };

    } catch (e) {
      console.error(` #${this.name}:emitToSocketId: ${e.message}`);
      return { success: false, message: `failed emitting message to: ${socketId}` };
    }
  }

  async broadcast(event, data = {}) {

    try {

      if (!this.isReady())
        return { success: false, message: `not ready` };

      // const broadcastRes =  await this.#io.sockets.emit(event, data);
      // io.emit();, io.local.emit();, ws.broadcast.emit(); // all not [socket]
      await this.#io.emit(event, data);
      return { success: true, message: `success` };
    } catch (e) {
      console.error(` #${this.name}:broadcast: event: ${event}: ${e.message}`);
      return { success: false, message: `failed to broadcast: ${event}` };
    }
  }

  async broadcastToRestaurant(restaurantId, event, data = {}, debug = false) {

    try {

      if (!this.isReady())
        return { success: false, message: `not ready` };

      // if( !this.App.isFunction(ack) )
      //   return {success: false, message: `[ack] must be a valid js function`};

      if (!this.isExistingRestaurantId(restaurantId))
        return { success: false, message: `restaurant: is not authenticated` };

      const mRestaurant = this.getRestaurantById(restaurantId);

      let atleastOneEmited = false;
      for (const socketId of Object.keys(mRestaurant.sockets)) {
        // const { ws } = mRestaurant.sockets[ socketId ];
        const emitRes = await this.emitToSocketId(socketId, event, data);
        if (!emitRes.success) {
          console.debug({ broadcastToRestaurant: { emitRes } });
        } else {
          atleastOneEmited = true;
        }
      }

      return { success: atleastOneEmited, message: atleastOneEmited ? `success` : 'no connected restaurants' };

    } catch (e) {
      console.error(` #${this.name}:broadcastToRestaurant: event: ${event}: ${e.message}`);
      return { success: false, message: `failed to broadcastToRestaurant: ${event}` };
    }
  }

  async broadcastToRestaurantWithAck(restaurantId, event, data = {}, ackTimeout = (30 * 1000), debug = false) {

    try {

      if (!this.isReady())
        return { success: false, message: `not ready` };

      // if( !this.App.isFunction(ack) )
      //   return {success: false, message: `[ack] must be a valid js function`};

      if (!this.isExistingRestaurantId(restaurantId))
        return { success: false, message: `restaurant: is not authenticated` };

      const mRestaurant = this.getRestaurantById(restaurantId);
      // console.json({ mRestaurant });
      let resolved = false;
      let emited = 0;
      if (!this.App.isPosNumber(ackTimeout)) {
        ackTimeout = (30 * 1000);
        console.warn(` #broadcastToRestaurantWithAck: setTimeout: set to default: ${ackTimeout}`);
      }

      return new Promise(async (resolve) => {

        for (const socketId of Object.keys(mRestaurant.sockets)) {
          // console.ok({socketId});
          // const { ws } = mRestaurant.sockets[ socketId ];
          const emitRes = await this.emitToSocketId(socketId, event, data, (ackData) => {
            if (resolved) return;
            try {
              resolved = true;
              resolve({
                ...ackData,
                data: {
                  ...ackData.data,
                  emited,
                }
              });
            } catch (e) {
              console.error(` <<< ack: ${e.message}`);
            }
          });
          // console.debug(emitRes);

          if (!emitRes.success) {
            console.debug({ broadcastToRestaurantWithAck: { emitRes } });
          } else {
            emited++;
          }

        }

        // console.debug({emited});
        if (emited === 0)
          return resolve({ success: false, message: 'no connected clients', data: { emited } });

        setTimeout(() => {
          if (!resolved) {
            try {
              resolve({ success: false, message: `no ack received, emited to: ${emited} restaurants`, data: { emited } });
            } catch (e) {
              console.error(` <<< setTimeout => !resolved: ${e.message}`);
            }
          }
        }, ackTimeout);

      });

    } catch (e) {
      console.error(` #${this.name}:broadcastToRestaurantWithAck: event: ${event}: ${e.message}`);
      return { success: false, message: `failed to broadcast to restauran twith ack: ${event}` };
    }
  }

  async onRestaurantDisconnect(ws) {

    try {

      console.error(`#${this.name}: [restaurant]: disconnect: userId: ${ws.info.userId}, restaurantId: ${ws.info.restaurantId}`);

      if (this.isExistingRestaurantId(ws.info.restaurantId))
        if (this.getRestaurantById(ws.info.restaurantId).sockets[ws.id])
          delete this.getRestaurantById(ws.info.restaurantId).sockets[ws.id];

      if (this.isExistingUserId(ws.info.userId))
        if (this.getUserById(ws.info.userId).sockets[ws.id])
          delete this.getUserById(ws.info.userId).sockets[ws.id];

      return { success: true, message: `success` };
    } catch (e) {
      console.error(` #${this.name}:onRestaurantDisconnect: ws.id: ${ws.id}: ${e.message}`);
      return { success: false, message: `failed clean up [on]:disconnect: ${ws.id}` };
    }
  }


  async broadcastToClientByUserId(userId, event, data = {}, debug = false) {

    try {

      if (this.App.isEnv('dev'))
        console.json({ broadcastToClientByUserId: { clientId, event, data } });

      if (!this.isReady())
        return { success: false, message: `not ready` };

      if (!this.isExistingUserId(userId))
        return { success: false, message: `client: is not authenticated` };

      const mUser = this.getUserById(userId);

      let atleastOneEmited = false;
      for (const socketId of Object.keys(mUser.sockets)) {
        // const { ws } = mUser.sockets[ socketId ];
        const emitRes = await this.emitToSocketId(socketId, event, data);
        if (!emitRes.success) {
          console.debug({ broadcastToClientByUserId: { emitRes } });
        } else {
          atleastOneEmited = true;
        }
      }

      return { success: atleastOneEmited, message: atleastOneEmited ? `success` : 'user is not connected on any device' };

    } catch (e) {
      console.error(` #${this.name}:broadcastToClientByUserId: event: ${event}: ${e.message}`);
      return { success: false, message: `failed to broadcastToClientByUserId: ${event}` };
    }
  }

  async broadcastToClientByClientId(clientId, event, data = {}, debug = false) {

    try {

      // if( this.App.isEnv('dev') )
      console.json({ broadcastToClientByClientId: { clientId, event, data } });

      if (!this.isReady())
        return { success: false, message: `not ready` };

      if (!this.isExistingClientId(clientId))
        return { success: false, message: `client: is not authenticated` };

      const mClient = this.getClientById(clientId);

      let atleastOneEmited = false;
      for (const socketId of Object.keys(mClient.sockets)) {
        // const { ws } = mClient.sockets[ socketId ];
        const emitRes = await this.emitToSocketId(socketId, event, data);
        if (!emitRes.success) {
          console.debug({ broadcastToClientByClientId: { emitRes } });
        } else {
          atleastOneEmited = true;
        }
      }

      return { success: atleastOneEmited, message: atleastOneEmited ? `success` : 'client is not connected on any device' };

    } catch (e) {
      console.error(` #${this.name}:broadcastToClientByClientId: event: ${event}: ${e.message}`);
      return { success: false, message: `failed to broadcastToClientByClientId: ${event}` };
    }
  }

  async broadcastToClientByCourierId(courierId, event, data = {}, debug = false) {

    try {

      if (this.App.isEnv('dev'))
        console.json({ broadcastToClientByCourierId: { courierId, event, data } });

      if (!this.isReady())
        return { success: false, message: `not ready` };

      if (!this.isExistingCourierId(courierId))
        return { success: false, message: `client: is not authenticated` };

      const mCourier = this.getCourierById(courierId);

      let atleastOneEmited = false;
      for (const socketId of Object.keys(mCourier.sockets)) {
        // const { ws } = mCourier.sockets[ socketId ];
        const emitRes = await this.emitToSocketId(socketId, event, data);
        if (!emitRes.success) {
          console.debug({ broadcastToClientByCourierId: { emitRes } });
        } else {
          atleastOneEmited = true;
        }
      }

      return { success: atleastOneEmited, message: atleastOneEmited ? `success` : 'courier is not connected on any device' };

    } catch (e) {
      console.error(` #${this.name}:broadcastToClientByCourierId: event: ${event}: ${e.message}`);
      return { success: false, message: `failed to broadcastToClientByCourierId: ${event}` };
    }
  }

  async onClientDisconnect(ws) {

    try {

      console.error(`#${this.name}: [client]: disconnect: userId: ${ws.info.userId}, clientId: ${ws.info.clientId}, courierId: ${ws.info.courierId}`);

      if (this.isExistingUserId(ws.info.userId))
        if (this.getUserById(ws.info.userId).sockets[ws.id])
          delete this.getUserById(ws.info.userId).sockets[ws.id];

      if (this.isExistingClientId(ws.info.clientId))
        if (this.getClientById(ws.info.clientId).sockets[ws.id])
          delete this.getClientById(ws.info.clientId).sockets[ws.id];

      if (this.isExistingCourierId(ws.info.courierId))
        if (this.getCourierById(ws.info.courierId).sockets[ws.id])
          delete this.getCourierById(ws.info.courierId).sockets[ws.id];

      return { success: true, message: `success` };
    } catch (e) {
      console.error(` #${this.name}:onClientDisconnect: ws.id: ${ws.id}: ${e.message}`);
      return { success: false, message: `failed clean up [on]:disconnect: ${ws.id}` };
    }
  }

  // async _autoCleanUp(){
  //   try{
  //     // this.getRoomSockets('/').sockets[ socketId ].delete();
  //   }catch(e){
  //     console.error(` #${this.name}:authenticate: ${e.message}`);
  //     return {success: false, message: `authentication server error`};
  //   }
  // }

  // [dev:tools]
  async _initVirtualConsole() {

    try {

      const self = this;

      if (!this.getConfig(true).virtualConsole.enabled)
        return console.warn(` #${this.name}:_initVirtualConsole: [virtual-console]: is not enabled`);

      if (!this.App.isFunction(console.on))
        return console.warn(` #${this.name}:_initVirtualConsole: [console.on]: stdout:streaming is not enabled`);

      console.on('stdout', (data_t, type = 'log') => {
        try {
          data_t = data_t.replace(/(\ ){1}/g, '&nbsp;');
          for (const mColor of consoleColors.colors) {
            data_t = data_t
              // .replace(/(\x1b\[[0-9]{1,2};[0-9]{0,2}m)|(\x1b\[[0-9]{1,2}m)|(\x1b\[[0-9m;]{1,})*/g,'')
              .replace(mColor.regExp, mColor.replace)
            // .replace(/(\n)*/g,'');
          }

          data_t = data_t.replace(/(\n)*/g, '');

          if (self.App.isObject(self.#io) && self.App.isFunction(self.#io.emit)) {
            self.#io.emit(this.getConfig(true).virtualConsole.eventName || 'log', {
              success: true, message: 'OK', data: {
                type,
                string: data_t,
              }
            });
          }

        } catch (e) {
          console.debug(` #${this.name}: virtual-console:stdout: ${e.message} `);
        }

      });

      console.ok(` #${this.name}: virtual-console: => ready`);
      self.App.emit('virtual-console-is-ready');

      return true;
    } catch (e) {
      console.error(` #${this.name}:_initVirtualConsole: ${e.message}`);
      return false;
    }
  }



}
