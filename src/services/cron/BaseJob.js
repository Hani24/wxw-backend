module.exports = BaseJob = class BaseJob{

  constructor( App, params ){
    this.App = App;
    this.name = (params.name || 'default').replace('.job','').trim();
    this.allowMultipleTasksAtTheSameTime = App.getBoolFromValue( params.allowMultipleTasksAtTheSameTime) || false;
    this.isEnabled = App.getBoolFromValue(params.isEnabled) || false;
    this.runOnce = App.getBoolFromValue(params.runOnce) || false;
    this.runAtStart = App.getBoolFromValue(params.runAtStart) || false;;
    this.runAt = App.isArray(params.runAt) ? params.runAt : [];

    this._debug = App.isBoolean(params.debug) ? params.debug : false;
    this._isStarted = false;
    this._isRunning = false;
    this._timeout_t = null;
    this._interval_t = null;
    this._executions = 0;
    this._errors = 0;
    this._successes = 0;
    this._successes = 0;
    this._innerRunnerIntervalMsec = 1000;
    this._subscribers = {};
    this._uuid = params.uuid || 0;
    this._tick = 0;

  }

  isDebugOn(){ return this._debug; }

  getTick(inc=false){ return (inc ? ++this._tick : this._tick); }

  on(event, callback){

    if( !this._subscribers[ event ] ){
      this._subscribers[ event ] = [];
    }

    this._subscribers[ event ].push( callback );
    return true;
  }

  async start(){
    if( this._isStarted )
      return this.genRes(false, 'job is already started');
    return await this._init();
  }

  genRes( success, message, data={}, name='' ){
    // message = `${this.name}: ${message}`;
    return { success, message, data, name: ( name || this.name ) };
  }

  async _init(){

    const self = this;
    self._isStarted = true;

    if( !self.isEnabled ){
      // console.warn(` #BaseJob:_init: warning: [ params.isEnabled ] == false; aborting job `);
      return self.genRes(false, 'job is not enabled');
    }

    if( self.runOnce ){
      self._timeout_t = setTimeout(()=>{ self._task() }, (+self.runEachSeconds) *1000 );
      return self.genRes(true, 'job started: as: [once]');

    }

    if( self.runAtStart ){
      self._timeout_t = setTimeout(()=>{ self._task() }, (+self.runEachSeconds) *1000 );
    }

    return await self._innerRunner();

  }

  async _innerRunner(){

    const self = this;

    if( !self.App.isArray(self.runAt) || !self.runAt.length )
      return self.genRes(false, '[runAt] is empty');

    // reset items
    for( const runAtItem of self.runAt ){
      if( !self.App.isObject(runAtItem) || !runAtItem.hasOwnProperty('type') )
        return self.genRes(false, 'each: runAt-item must include: [ .type:<string> ]');

      if( !runAtItem.hasOwnProperty('at') && !runAtItem.hasOwnProperty('each') )
        return self.genRes(false, 'each: runAt-item must include: [ .at:<string> || .each:<string> ]');
 
      runAtItem._processed = true;
      runAtItem._prevValue = -1;
    }

    self._interval_t = setInterval( async()=>{

      const date_t = new Date(); // (new Date()).toISOString();
      // console.log(date_t.toISOString());

      const currentDatetime = {
        days: date_t.getDate(),
        hours: date_t.getHours(),
        minutes: date_t.getMinutes(),
        seconds: date_t.getSeconds(),
      };

      // console.json({currentDatetime});

      for( const runAtItem of self.runAt ){
        // console.line();
        // console.debug({runAtItem});

        if( currentDatetime.hasOwnProperty(runAtItem.type)  ){

          // [AT]: *time
          if( self.App.isNumber(runAtItem.at) ){
            if( currentDatetime[ runAtItem.type ] === runAtItem.at ){

              if( runAtItem._prevValue != currentDatetime[ runAtItem.type ] ){

                if( !runAtItem._processed ){
                  runAtItem._prevValue = currentDatetime[ runAtItem.type ];
                  const taskExecRes = await self._task( runAtItem );
                  if( !taskExecRes.success ){
                    console.error({taskExecRes});
                    self.App.emit('cron:task:error', taskExecRes );
                  }else{
                    // console.ok({taskExecRes});
                  }

                  runAtItem._processed = true;
                }

              }
            }else{
              // reset for next interval
              runAtItem._processed = false;
            }
          }

          // [EACH]: *time
          // console.log(`  runAtItem._prevValue: ${runAtItem._prevValue}`);
          if( self.App.isNumber(runAtItem.each) ){

            if( runAtItem.each === 1 ){

              if( runAtItem._prevValue != currentDatetime[ runAtItem.type ] ){
                // console.debug(`each:isNumber:`);
                // console.debug(`  runAtItem.type                    : ${runAtItem.type}`);
                // console.debug(`  currentDatetime[ runAtItem.type ] : ${currentDatetime[ runAtItem.type ]}`);
                // console.debug(`  runAtItem.each                    : ${runAtItem.each}`);
                // console.debug(`  runAtItem._prevValue              : ${runAtItem._prevValue}`);

                if( !runAtItem._processed ){
                  // console.debug('each: [ (!) runAtItem._processed] ');
                  runAtItem._prevValue = currentDatetime[ runAtItem.type ];
                  const taskExecRes = await self._task( runAtItem );
                  if( !taskExecRes.success ){
                    console.error(taskExecRes);
                    self.App.emit('cron:task:error', taskExecRes );
                  }else{
                    // console.ok({taskExecRes});
                  }

                  runAtItem._processed = true;
                }else{
                  runAtItem._processed = false;
                }
              }

            }else if( currentDatetime[ runAtItem.type ] % runAtItem.each === 0 ){
              // console.debug(`each:isNumber:`);
              // console.debug(`  runAtItem.type                    : ${runAtItem.type}`);
              // console.debug(`  currentDatetime[ runAtItem.type ] : ${currentDatetime[ runAtItem.type ]}`);
              // console.debug(`  runAtItem.each                    : ${runAtItem.each}`);
              // console.debug(`  runAtItem._prevValue              : ${runAtItem._prevValue}`);

              if( runAtItem._prevValue != currentDatetime[ runAtItem.type ] ){
                if( !runAtItem._processed ){
                  runAtItem._prevValue = currentDatetime[ runAtItem.type ];
                  const taskExecRes = await self._task( runAtItem );
                  if( !taskExecRes.success ){
                    console.error({taskExecRes});
                    self.App.emit('cron:task:error', taskExecRes );
                  }else{
                    // console.ok({taskExecRes});
                  }
                  runAtItem._processed = true;
                }
              }
            }else{
              // reset for next interval
              runAtItem._processed = false;
            }

            runAtItem._prevValue = currentDatetime[ runAtItem.type ];

          }

        }

      }

    }, self._innerRunnerIntervalMsec );

    return self.genRes(true, 'inited');

  }

  isRunning(){
    return this._isRunning;
  }

  async _task( runAtItem={} ){

    const self = this;

    if( self.isRunning() && !self.allowMultipleTasksAtTheSameTime )
      return self.genRes(false, `There is another instance of [${self.name}] is running, allow-multiple instances ? => set: Task({ allowMultipleTasksAtTheSameTime: true })` );

    self._isRunning = true;
    const tick = self.getTick(true);
    // console.log(` # Cron-Job:task: ${self.name} running ... `);

    try{

      clearTimeout( self._timeout_t );
      self.executions++;

      for( const callback of self._subscribers['task'] ){
        if( this.App.isFunction(callback) ){
          try{
            // console.debug({emit: {event: 'task', runAtItem, callback}});
            const execRes = await callback( self, runAtItem );
          }catch(e){
            this.error(`callback: ${e.message}`);
            this.log(e);
          }
        }
      }

      self._successes++;
      // console.ok(` # Cron-Job:task: ${self.name}, ended.`);
      const genedRes = self.genRes(true, 'task ended' );
      self._isRunning = false;
      return genedRes;

    }catch(e){
      self.error(`error: ${e.message}`);
      self._isRunning = false;
      self._errors++;
      return self.genRes(false, e.message );

    }

  }

  log(){ console.log(`job: [${console.W(this.name)}]: [${this.getTick(false)}]`, ...arguments); }
  info(){ console.log(`job: [${console.B(this.name)}]: [${this.getTick(false)}]`, ...arguments); }
  warn(){ console.log(`job: [${console.Y(this.name)}]: [${this.getTick(false)}]`, ...arguments); }
  error(){ console.log(`job: [${console.R(this.name)}]: [${this.getTick(false)}]`, ...arguments); }
  ok(){ console.log(`job: [${console.G(this.name)}]: [${this.getTick(false)}]`, ...arguments); }
  debug(){ console.log(`job: [${console.P(this.name)}]: [${this.getTick(false)}]`, ...arguments); }
  line(){ console.line(); }
  json(json_t){ console.log(`job: [${console.P(this.name)}]: [${this.getTick(false)}]: `); console.json(json_t) }

}
