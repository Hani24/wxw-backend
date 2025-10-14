const bodyParser = require('body-parser');
const serveStatic = require('serve-static');
const compression = require('compression'); // GZip ...
const express = require('express');
const autoRouter = require('./express.auto-router');
const middlewares = require('./middlewares');
const modifiers = require('./modifiers/');

const expressHelpers = {
  post      : require('./helpers/post.js'),
  urlParser : require('./helpers/url-parser.js'),
  pagination   : require('./helpers/pagination.js'),
  // session   : require('./helpers/session.js'),
};

module.exports = async( App )=>{

  const appConfig = App.getConfig();

  const SUB_DOMAIN = App.getEnv('SUB_DOMAIN'); // 'api';
  const DOMAIN = App.getEnv('DOMAIN'); // '3dmadcat.ru';
  const PROTOCOL = App.getEnv('PROTOCOL'); // 'https';
  const WEBSITE = App.getEnv('WEBSITE');

  const SERVER_MAX_POST_SIZE = App.getEnv('SERVER_MAX_POST_SIZE');
  const SERVER_COMPRESSION = App.getEnvAsBool('SERVER_COMPRESSION');
  const SERVER_ALLOW_IP_ACCESS = App.getEnvAsBool('SERVER_ALLOW_IP_ACCESS');

  const app = express();
  App.modifiers = modifiers(App);

  app.use((req, res, next)=>{
    req.lang = 'en';
    res.lang = 'en';
    next();
  });

  const rawBodySaver = (req, res, buffer, encoding) =>{
    try{
      // console.log({rawBodySaver: {buf}});
      // if( req.path === '/public/stripe/web-hook/' ){}
      if (buffer && buffer.length) {
        // req.rawBody = buffer.toString(encoding || 'utf8');
        req.rawBody = Buffer.from( buffer );
      }
    }catch(e){
      console.error(`#rawBodySaver: ${e.message}`);
    }
  }

  // app.use( cookieParser() );
  app.use( express.json({limit: SERVER_MAX_POST_SIZE, extended: false, verify: rawBodySaver}) );
  app.use (function (error, req, res, next){
    if( error ){
      App.logger.error(error);
      console.error(` #main: [0]: [broken-json] ${error.message}`);
      return res
        .status(417)
        .json({success: false, message: App.t('broken-json', req.lang), data: {} });
    }
    next();
  });

  app.use(express.urlencoded({limit: SERVER_MAX_POST_SIZE, extended: true}));
  app.use (function (error, req, res, next){
    if( error ){
      App.logger.error(error);
      console.error(` #main: [1]: [broken-url-data] ${error.message}`);
      return res
        .status(417)
        .json({success: false, message: App.t('broken-url-data', req.lang), data: {} });
    }
    next();
  });

  // [COMMON-REQUEST-METHODS]
  console.line();
  console.ok(` #ST: [helpers]:`);
  Object.keys(expressHelpers).map((helperName)=>{
    console.info(`     #helper: ${ helperName } `);
    app.use((req, res, next)=>{
      expressHelpers[ helperName ]( req, res, next, App, helperName );
    });
  });

  // [COMMON-INFO]
  app.use( async function(req, res, next){ 

    try{

      // https://developer.mozilla.org/en-US/docs/Web/HTTP/Methods
      res.header('Access-Control-Allow-Origin', '*');
      res.header('Access-Control-Allow-Headers', '*');
      res.header('access-control-allow-methods', 'GET,PUT,POST,HEAD,DELETE,OPTIONS');
      res.header('X-Powered-By', 'Morris-Armstrong-II');

      const _method = (''+req.method).trim().toLowerCase();
      const _path = (''+req.path);
      const _origin = (req.headers['origin'] || '');
      const _originDomain = _origin ? _origin.split('://')[1] : '';
      const _protocol = _origin ? _origin.split('://')[0] : (req.headers['x-forwarded-proto'] || '');
      const _secure = ( _protocol === 'https' );
      const _start_t = Date.now();
      const _ray = req.headers['cf-ray'] || 'n/a'; // if CloudFlare is in use
      const _host = req.headers['x-forwarded-server'] || req.headers['host'] || 'n/a';

      // console.json({
      //   'x-forwarded-for': req.headers['x-forwarded-for'],
      //   'x-real-ip': req.headers['x-real-ip'],
      //   remoteAddress: req.connection.remoteAddress
      // });

      let _ip = (req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || req.connection.remoteAddress || 'n/a');

      // 94.109.166.239
      _ip = _ip.match(/^192\.168.*/) ? '141.135.200.102' : _ip;
      // console.log({_ip});

      const geoipRes = await App.geoip(_ip);
      // console.json({geoipRes});
      const _country = geoipRes.success ? geoipRes.data.country : 'n/a'; // req.headers['cf-ipcountry'] || '';
      const _timezone = geoipRes.success ? geoipRes.data.timezone : 'n/a';
      let lat = 0;
      let lon = 0;

      if( App.isArray(geoipRes.data.ll) && geoipRes.data.ll.length === 2 ){
        lat = +(geoipRes.data.ll[0]);
        lon = +(geoipRes.data.ll[1]);
      }

      res.info = {
        method: _method,
        path: _path,
        origin: _origin,
        protocol: _protocol,
        secure: _secure,
        start: _start_t,
        country: _country,
        timezone: _timezone,
        ray: _ray, 
        ip: _ip,
        host: _host,
        lat,
        lon,
      };

      App.logger.access( `[${res.info.ip}]`, res.info );

      if( _method === 'options' )
        return App.json(res, 200, 'success');

      // if( !SERVER_ALLOW_IP_ACCESS ){
      //   // console.log({_originDomain, host: res.info.host});
      //   // if( (_originDomain || res.info.host) !== `${SUB_DOMAIN}.${DOMAIN}` ){
      //   if( !( /*_originDomain || */ res.info.host).endsWith(DOMAIN) ){
      //     App.logger.warn(`[403]: SERVER_ALLOW_IP_ACCESS: [4]`);
      //     // console.warn(`[403]: SERVER_ALLOW_IP_ACCESS: [4]`)
      //     return App.json(res, 403, App.t(['[4]','direct access: forbidden'], req.lang));
      //   }
      // }

      const isFile = console.isFile(`${App.public_html}/${ _path.replace(/\.\./g,'') }`);

      const info_log = [
        (isFile ? console.P('file') : console.R(res.info.method) ),
        console[ res.info.secure ? 'G' : 'Y' ](res.info.protocol),
        console.W(res.info.country),
        console.B(res.info.ip),
        console.W( _originDomain || res.info.host ),
      ];

      const req_path_info = '['+console.W(_path)+' : '+console.W( req.query ? JSON.stringify(req.query):'' )+']';
      console.log( `[${info_log.join(', ')}] ${req_path_info}` );

      // console.json({ pagination: req.getPagination() });
      return next();

    }catch(e){
      console.warn(` #express:e: ${e.message}`);
      res.status(500).json({success: false, message:'server-error', data: {}});
      next('server-error');
    }

  });

  // [COMPRESSION]
  if( SERVER_COMPRESSION ){
    console.ok(` #compression: [on]:`);
    app.use( compression({
      filter: function(req, res) {
        try{
          if (req.headers['x-no-compression']) return false
        }catch(e){
          console.error(' #compression: '+e.message);
          console.error( e );
        }
        return compression.filter( req, res );
      }
    }));
  }

  // [STATIC]
  console.ok(` #public_html: [${App.public_html}]:`);
  app.use( serveStatic( `${App.public_html}`, {
    // acceptRanges: '', // Enable or disable accepting ranged requests, defaults to true. Disabling this will not send Accept-Ranges and ignore the contents of the Range request header.
    // cacheControl: '', // Enable or disable setting Cache-Control response header, defaults to true. Disabling this will ignore the immutable and maxAge options.
    // dotfiles: 'deny', // local fs [.filename] access
    // maxAge : 0,
    // setHeaders: function (res, path) {
    //   res.setHeader('X-Powered-By', App.conf.app.name+' - 'App.conf.app.version );
    // }
  }));

  if( appConfig.socketServer && appConfig.socketServer.enabled ){
    const serveJsPath = `${App.public_html}${appConfig.socketServer.serveJs}`;
    if( console.isDir(serveJsPath) ){
      console.ok(` #socketServer.serveJs: [${appConfig.socketServer.serveJs}]:`);
      app.use( serveStatic( `${serveJsPath}`, {}) );
    }
  }

  // [SECURITY]
  // app.use( helmet.contentSecurityPolicy() );
  // if( App.conf.express.noSniff ) app.use( helmet.noSniff() );
  // if( App.conf.express.referrerPolicy ) app.use( helmet.referrerPolicy() );
  // if( App.conf.express.xssFilter ) app.use( helmet.xssFilter() );
  // app.use( helmet.expectCt() );
  // app.use( helmet.dnsPrefetchControl() );
  // app.use( helmet.frameguard() );
  // app.use( helmet.hidePoweredBy() );
  // app.use( helmet.hpkp() );
  // app.use( helmet.hsts() );
  // app.use( helmet.ieNoOpen() );
  // app.use( helmet.noCache() );

  // [MIDDLEWARES] Use All 
  // if( ! App.isDaemon() )
  if( appConfig.useMiddlewares )
    await middlewares( App, app );

  // [ROUTES] Attach All routes and apis
  // if( ! App.isDaemon() )

  if( appConfig.useAutoRouter )
    await autoRouter( App, app );

  app.use (function (error, req, res, next){
    if( error ){
      App.logger.error(error);
      console.error(` #main: [2]: [broken-data] ${error.message}`);
      return res
        .status(417)
        .json({success: false, message: App.t('broken-data', req.lang), data: {} });
    }
    next();
  });

  // not in use. currently user lang is auto-set in auth-middlewares 
  // app.use( async(req, res, next) => {
  //   if( req.user && req.user.lang ){
  //     req.lang = req.user.lang;
  //   }
  //   next();
  // });

  // Catch all left-over requests
  app.use('*', async(req, res, next) => { 
    // console.warn(` [404]: ${res.info.path} => ${res.info.ip}`);
    App.logger.warn(` [404]: ${res.info.path} => ${res.info.ip}`);
    App.json(res, 404, App.t(['route', 'not', 'found'], req.lang), {});
    // console.debug(` redirect ...`);
    // res.redirect(WEBSITE);
  });

  return app;

}
