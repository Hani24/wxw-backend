
module.exports = ( App, express, name )=>{

  return false;

  // [Admin-Access]
  express.use('/supported-email-domains', async(req, res, next)=>{

    return App.json(res, 200, App.t(['success'], req.lang), []);

    // const listRes = App.Mailer.getAllowedEmailDomains();
    // if( !listRes.success )
    //   return App.json(res, 417, App.t(['error'], req.lang));
    // return App.json(res, 200, App.t(['success'], req.lang), listRes.data);

  });

  return true;

}