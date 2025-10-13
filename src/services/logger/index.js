const logger = require('mii-logger.js');

const LOG_TYPES = ['fatal','error','warn','info','access','log','debug'];

let logs_root = '';

const getLogFileDateName = (type_t)=>{
  return ((new Date()).toISOString().split('T')[0]).trim();
}

const getLogTime = (type_t)=>{
  return (((new Date()).toISOString().split('T')[1]).trim().split('.')[0]).trim();
}

const _log = function(type_t){

  try{

    const logDateName = getLogFileDateName();

    const logPath = `${logs_root}/${type_t}`
    const logName = `${logDateName}.log`;

    if( !console.isDir(logPath) )
      console.shell.sync(`mkdir -p ${logPath}`);

    const data_t = [ '-----------------------------------',`[${getLogTime()}]: ` ];

    // find all instances if Error
    for( let i=1; i<arguments.length; i++ ){
      try{
        if( arguments[i] instanceof Error ){
          data_t.push( `Error: ${arguments[i].message}: \nstack: ${ (!!arguments[i].stack) ? arguments[i].stack : 'no-stack' }`);
          // data_t.push( `\n` );
        }
      }catch(e){ }
    }

    // find all other data
    for( let i=1; i<arguments.length; i++ ){
      try{
        if( ! (arguments[i] instanceof Error) ){
          data_t.push( typeof arguments[i] === 'object' ? JSON.stringify(arguments[i], null, 2) : arguments[i] );
        }
      }catch(e){ }
    }

    console.appendFileSync(`${logPath}/${logName}`, `${data_t.join('\n\n')}\n\n`);

  }catch(e){
    console.warn(` #logs: ${e.message}`);
    return false;
  }

}

// App.logger.error(error);
module.exports = function(App, params){

  logs_root = App.logs_root;
 
  if( App.isString(logs_root) )
    if( !console.isDir(logs_root) )
      console.shell.sync(`mkdir -p ${logs_root}`);

  const loggers = { };

  for( const type_t of LOG_TYPES )
    loggers[ type_t ] = function(...arguments){ _log(type_t, ...arguments); };
  return loggers;

}



if( module.parent ) return;

const mLog = module.exports({logs_root: '/tmp/logs-test'},{});

mLog.fatal('[fatal]', {A:1}, [0,1,2],'<string>');
mLog.error('[error]', {A:1}, [0,1,2],'<string>');
mLog.warn('[warn]', {A:1}, [0,1,2],'<string>');
mLog.info('[info]', {A:1}, [0,1,2],'<string>');
mLog.log('[log]', {A:1}, [0,1,2],'<string>');
mLog.debug('[debug]', {A:1}, [0,1,2],'<string>');

const list = console.shell.sync(`ls -lah ${'/tmp/logs-test'}`);
logger.log(list);
