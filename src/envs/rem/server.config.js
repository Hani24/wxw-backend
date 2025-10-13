const logger = require('mii-logger.js');

const NODE_ENV = process.env.NODE_ENV;

module.exports = (params={})=>{
  return {
    root: `${params.root}`,
    public_html: `/src/public_html`,
    services_root: `/src/services`,
    emails_root: `/src/email-templates`,
    logs_root: `/logs`,
    useStrictPath: false, // default: false, eg: /^/public/user/( >> $)/
    runPostBootTasks: false, // default: true
    useMiddlewares: false, // default: true
    useAutoRouter: false, // default: true
    enableDaemond: false, // default: false
    daemonServices: [
      // 'cron'
    ],
    mainServices: [
      'i18n','DT','JWT','BCrypt','tools', 
      'geoip','RSA','logger','S3','multer',
      'Push','payments','geo','Mailer',
    ],
    socketServer: {
      enabled: true,
      serverJs: `/socket/${NODE_ENV}/js/`,
      debug: false,
      socket: {
        origin: '*',
        serveClient: true,
        path: `/socket/${NODE_ENV}/io/`,
        connectTimeout: 45000, // [45000] default
        pingTimeout: 20000, // [20000] default
        pingInterval: 25000, // [25000] default
        maxHttpBufferSize: 1e6, // <== 1MB [1e6] default
        allowEIO3: true, // [false] default
      },
      virtualConsole: {
        enabled: false,
        eventName: 'live-debug-log'
      }
    },
    nodes: {
      master: {
        enabled: true,
        services: [
          'cron', 
        ],
        params: {
          useStrictPath: false,
          runPostBootTasks: true,
          useAutoRouter: true,
          useMiddlewares: true,
        }
      },
      api: {
        enabled: true,
        services: [
          'firebase','sms','UI',
          // 'cron', 
          // 'Telegram',
        ],
        params: {
          useStrictPath: false,
          runPostBootTasks: true,
          useAutoRouter: true,
          useMiddlewares: true,
        }
      },
    }
  };
};
