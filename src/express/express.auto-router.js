require('mii-logger.js');

module.exports = async( App, express )=>{

  try{

    const IS_PROD = App.getEnvAsBool('IS_PROD');
    const routesRoot = `${App.app_root}/routes`;
    const accessTypes = [ 'public', 'private' ];
    const appConfig = App.getConfig(false);
    const isMasterNode = App.isNodeOfTypeEnabled('master');
    const isApiNode = App.isNodeOfTypeEnabled('api');

    // const flowchart = {};

    console.line();
    console.info(` #Auto-Router: ${routesRoot}`);

    let totalRoutes = 0;
    function createAutoRoutesSubConfig( path ){

      const conf = {};

      if( console.isDir( path ) ){

        const paths = console.listDir( path );

        for( let p of paths ){

          if( console.isDir( path+'/'+p ) ){
            const sub = (path+'/'+p).replace( routesRoot, '');
            // console.log({sub});
            conf[ sub ] = createAutoRoutesSubConfig( path+'/'+p );

          }else{

            const filePath = path;
            const routePath = (path).replace( routesRoot, '');
            const routeFile = (path+'/'+p).replace( routesRoot, '').replace(routePath, '');
            const fullRouterPath = filePath+''+routeFile;
            let RPath = (routePath+( routeFile.trim() == '/index.js' ? (appConfig.useStrictPath ? '$':'') : '/'+routeFile)).replace('//','/').replace('.js','');


            if( fullRouterPath.endsWith('.js') && !fullRouterPath.endsWith('.sub-flow.js') && console.isFile( fullRouterPath ) ){

              try{
                require( fullRouterPath )( App, 'RPath' );
              }catch(e){
                console.error(` #Auto-Router: ${e.message}`);
                console.error(`   route: ${ fullRouterPath }`);
                console.error(e);
                process.exit();
              }

              const R = require( fullRouterPath )( App, 'RPath' );
                    R.method = (R.method.toString()).trim().toLowerCase();

              // current node can be [master] && [api] at the same time, eg: in [dev] env
              if( isMasterNode && !isApiNode && ( (!R.node) || R.node !== 'master' ) ){
                continue;
              }

              RPath = RPath.endsWith('/') ? RPath.substr(0, RPath.length -1) : RPath;

              const method = R.method ? console.B( R.method.trim().toUpperCase() ) : console.R( 'ANY' );
              const root_part = RPath.substr(1).split('/')[0]

              // const log_prepend = '   #AR: ['+method+': http://'+App.host+':'+App.port+'';
              // const log_prepend = `   #AR: ${method}: ${App.protocol}://${App.host}:${App.port}`;
              const log_prepend = `   #AR: ${method}: `;
              const log_append = ` ${R.strict ? console.R('[$]') : console.G('[/.*]')}: [id: ${++totalRoutes}]`;

              const access = { is: {} };
              let rest = RPath;
              let log_middle = '';

              for( const accessType of accessTypes ){
                const mRegExp = new RegExp(`^/${accessType}`);
                access.is[ accessType ] = !!mRegExp.test(RPath);
                rest = rest.replace( mRegExp, '' );
              }

              if( access.is['public'] ){
                log_middle = console.W('/public');
              }else if( access.is['private'] ){
                log_middle = console.B('/private');
              }else{
                // [ALL] other
              }

              console.log( log_prepend +( ( log_middle )+console.Y(rest) )+ log_append );

              // GET, PUT, POST, ...
              if( R.method ){
                express[ R.method ]( `${RPath}${ R.strict ? '' : '*' }`, R.router )
              }else{
                express.use( `${RPath}${ R.strict ? '' : '*' }`, R.router );
              }

              // express.use( function(error, req, res, next){
              //   if( error ){
              //     App.logger.error(error);
              //     console.error(` #main: [0]: [fatal-route-exception]: RPath: ${RPath} => ${error.message}`);
              //     return res
              //       .status(500)
              //       .json({success: false, message: App.t(['server-error'], req.lang), data: {} });
              //   }
              //   next();
              // });

            }

          }
        }

      }

      return conf;

    }

    createAutoRoutesSubConfig( routesRoot ); 
    console.ok(' #Auto-Router: init done ...');

    // if( !IS_PROD ){
    //   console.writeFileSync(`${App.public_html}/dev/routes/schemas/ROUTES-LIST.md`, routesArrayData);
    // }

  }catch(e){
    console.warn(` #router-config: ${e.message}`);
    console.error( e );
    process.exit(-1);
  }
}

