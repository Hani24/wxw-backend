class Socket extends EventEmitter {
  constructor(params={}){
    super();
    this.params = (typeof params === 'object' ? params : {});
    this.connectionUrl = params.connectionUrl || `wss://${location.host}`;
    this.env = params.env || 'dev';
    this.name = 'Socket';
    this._sock = null;
    this._isReady = false;
    this.authCreds = {token: params.token || '' };

    this._innerEvents = [
      'info',
      'adminMessage',
      'courierMessage',
      'supplierMessage',
      'clientMessage',
      'newUnpaidOrder',
      'clientConfirmedOrder',
      'clientPaidOrder',
      'orderHasBeenPaid',
      'clientCanceledOrder',
      'clientRejectedOrder',
      'courierAssignedToOrder',
      'courierCanceledOrder',
      'courierArrived',
      'courierGotOrder',
      'orderCompleted',
      'orderRated',
      'adminP2pMessage',
      'adminBroadcastMessage'
    ];

    this._init();
  }

  isReady(){ return this._isReady; };
  setAuthCreds(creds={}){ this.authCreds = typeof creds === 'object' ? creds : this.authCreds; return this.authCreds; };

  async _init(){

    const self = this;

    try{

      console.info(` #${self.name}:_init`);
      self._isReady = false;

      self._sock = io.connect(self.connectionUrl, {
        path: self.params.path || `/socket/${self.env}/io/`,
        extraHeaders: self.params.extraHeaders || { env: self.env },
        reconnection: self.params.reconnection || true,
        reconnectionAttempts: self.params.reconnectionAttempts || Infinity,
        autoConnect: self.params.autoConnect || true,
        reconnectionDelay: self.params.reconnectionDelay || 1000,
        reconnectionDelayMax: self.params.reconnectionDelayMax || 5000,
        randomizationFactor: self.params.randomizationFactor || 0.5,
        timeout: self.params.timeout || 20000, // for each connection attempt
        // auth: { token: "abcd" },
      });

      self._initSystemEvents();
      self._initInnerEvents();
      self._initMainEvents();

      self._isReady = true;
      console.log(` #${self.name}: ready`);

    }catch(e){
      console.error(` #${self.name}:_init ${e.message} `);
      console.log(e.stack);
    }

  }

  async authenticate(){
    try{
      if( !this.isReady() ){
        console.error(` #${this.name}:authenticate: not ready `);
        return false;
      }

      await this.sleep(2000);
      this._sock.emit('authenticate', this.authCreds);

      return true;
    }catch(e){
      console.error(` #${this.name}:authenticate: ${e.message} `);
      return false;
    }

  }

  _initSystemEvents(){
    try{
      this._sock.on('reconnect',(err,info)=>{ console.log(`reconnect: `, {err, info}); });
      this._sock.on('reconnect_attempt',(err,info)=>{ console.log(`reconnect_attempt: `, {err, info}); });
      this._sock.on('reconnecting',(err,info)=>{ console.log(`reconnecting: `, {err, info}); });
      this._sock.on('reconnect_error',(err,info)=>{ console.log(`reconnect_error: `, {err, info}); });
      this._sock.on('reconnect_failed',(err,info)=>{ console.log(`reconnect_failed: `, {err, info}); });
      this._sock.on('connect_error',(err)=>{
        console.log(`connect_error: [${err.type || 'n/a'}] => message: ${err.message}, description: [${ err.description || 'n/a'}] `);
        // err.columnNumber: 8587
        // err.​​description: 502
        // err.​​fileName: "https://api.3dmadcat.ru/socket/dev/r/socket.io.min.js"
        // err.​​lineNumber: 6
        // err.​​message: "xhr poll error"
        // err.type: '...'
        // err.​​stack: []
      });
    }catch(e){
      console.error(` #${this.name}:_initSystemEvents ${e.message} `);
      console.log(e.stack);
    }
  }

  _initInnerEvents(){
    const self = this;

    try{

      self._sock.on('authenticate',(data, ack=false)=>{
        try{
          if( typeof ack === 'function' )
            ack({success: true, message: ['authenticate','success']});
        }catch(e){
          console.warn(` #${self.name}:on:${'authenticate'}: => [ack]: ${e.message}`);
        }
        if( !data.success )
          console.log(`authenticate: ${data.message}`);

        self.emit('authenticate', data );

        // if( !data.success ) return;
        // setTimeout(()=>{
        //   console.log(' => sock.disconnect');
        //   sock.disconnect(); // sock.close(); || sock.disconnect();
        //   setTimeout(()=>{
        //     console.log(' => sock.connect');
        //     sock.connect();
        //   }, 2000);
        // }, 2000);
      });

      self._sock.on('disconnect',()=>{
        console.log(`disconnect: id: ${self._sock.id}: connected: ${self._sock.connected} `);
      });

      self._sock.on('connect',()=>{
        console.log(`connect: id: ${self._sock.id}: connected: ${self._sock.connected} `);
        self.authenticate();
      });

    }catch(e){
      console.error(` #${this.name}:_initInnerEvents ${e.message} `);
      console.log(e.stack);
    }
  }

  _initMainEvents(){
    const self = this;

    try{

      for( const event_t of self._innerEvents ){
        // console.log(` event_t: ${event_t}`);
        self._sock.on( event_t , async(data, ack=false)=>{
          console.log({on: {event_t} });
          try{
            if( typeof ack === 'function' )
              ack({success: true, message: [event_t,'success']});
          }catch(e){
            console.warn(` #${self.name}:on:${event_t}: => [ack]: ${e.message}`);
          }
          self.emit( event_t, data );
        });

      }

      // this._sock.on('new-unpaid-order', async(data, ack=false)=>{
      //   if( typeof ack === 'function' ) ack({success: true, message: 'ack:success'});
      //   console.log({event: 'new-unpaid-order', data });
      // });

      // this._sock.on('order-has-been-paid', async(data, ack=false)=>{});
      // this._sock.on('client-canceled-order', async(data, ack=false)=>{});
      // this._sock.on('client-rejected-order', async(data, ack=false)=>{});
      // this._sock.on('courier-assigned-to-order', async(data, ack=false)=>{});
      // this._sock.on('courier-canceled-order', async(data, ack=false)=>{});
      // this._sock.on('courier-arrived', async(data, ack=false)=>{});
      // this._sock.on('courier-got-order', async(data, ack=false)=>{});
      // this._sock.on('order-completed', async(data, ack=false)=>{});
      // this._sock.on('order-rated', async(data, ack=false)=>{});
      // this._sock.on('admin-p2p-message', async(data, ack=false)=>{});
      // this._sock.on('admin-broadcast-message', async(data, ack=false)=>{});


    }catch(e){
      console.error(` #${this.name}:_initMainEvents ${e.message} `);
      console.log(e.stack);
    }
  }

}
