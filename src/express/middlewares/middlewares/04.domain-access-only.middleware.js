
module.exports = ( App, express )=>{

  return false;

  const SUB_DOMAIN = process.env.SUB_DOMAIN; // 'api';
  const DOMAIN = process.env.DOMAIN; // '3dmadcat.ru';
  const PROTOCOL = process.env.PROTOCOL; // 'https';
  const SERVER_ALLOW_IP_ACCESS = App.getBoolFromValue( process.env.SERVER_ALLOW_IP_ACCESS );

  // [domain-ip-access-filter]
  express.use( async(req, res, next)=>{

    if( !SERVER_ALLOW_IP_ACCESS ){
      // SUB_DOMAIN => api, DOMAIN => 3dmadcat.ru, PROTOCOL => https
      if( !res.info.host.match( new RegExp(DOMAIN) ) ){
        console.warn(` [403] #access-forbidden: [0]: [${req.path}]: [${res.info.ip}]`);
        App.logger.error({ message: 'access-forbidden', data: res.info });
        return App.json( res, 403, App.t(['access','forbidden'], req.lang) );
      }
    }

    return next();

  });

  return true;

}