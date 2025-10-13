const express = require('express');
const router = express.Router();

// {
//   "email": "required: <string>",
//   "password": "required: <string>"
// }


module.exports = function(App, RPath){

  router.use('', async(req, res)=>{

    try{

      //await console.sleep(1500);

      const data = req.getPost();
      const email = App.tools.normalizeEmail(req.getCommonDataString('email', null));
      const password = req.getCommonDataString('password', null);
      const roles = App.getModel('User').getRoles({});
      if( !App.tools.isValidEmail(email) )
        return App.json(res, 417, App.t(['valid','email-address','is-required'], req.lang));

      if( !password )
        return App.json(res, 417, App.t(['valid','password','is-required'], req.lang));

      const mUser = await App.getModel('User').findOne({
        where: { email },
        role: roles.admin,
      });

      if( !App.isObject(mUser) || !App.isPosNumber(mUser.id) )
        return App.json( res, 417, App.t(['account','not','found'], req.lang), {email, password} );
	    const passwordMatches = await App.BCrypt.compare(password, mUser.password);
      if( 
        !App.isObject(mUser) 
        || 
        !App.isPosNumber(mUser.id)
        || 
        !( await App.BCrypt.compare( password, mUser.password ) )
      ){
        return App.json(
          res, 
          417, 
          App.t(['account','not','found','and','/','or','wrong','email','/','password'], req.lang),
        );
      }

      if( mUser.role !== roles.admin ){
        return App.json( res, 417, App.t(['account','not','found','and','/','or','wrong','email','/','password'], req.lang));
        // return App.json( res, 401, App.t(['account','type','is-not','valid'], req.lang));        
      }

      if( !mUser.isEmailVerified )
        return App.json( res, 417, App.t(['email-verification','is-required'], req.lang));

      // if( mUser.isRestricted )
      //   return App.json( res, 417, App.t(['account','is','restricted','or','verification','process','is-not','completed'], req.lang ));

      const sessionRes = await App.getModel('Session').getOrCreate({
        userId: mUser.id,
        country: res.info.country,
        timezone: res.info.timezone,
        ip: res.info.ip,
      });

      if( !sessionRes.success || !App.isObject(sessionRes.data) || !App.isPosNumber(sessionRes.data.id) )
        return App.json( res, false, App.t(['failed-to','create','session'], req.lang));

      const mSession = sessionRes.data;

      // const updateRes = await mSession.update({});
      // if( !App.isObject(updateRes) || !App.isPosNumber(updateRes.id) )
      //   return App.json( res, false, App.t(['failed','to','update','session'], req.lang));

      const jwtToken = await App.JWT.sign({
        userId: mUser.id, 
        sessionId: mSession.id, 
        token: mSession.token,
      //  role: mUser.role, 
        country: res.info.country,
        timezone: res.info.timezone,
        ip: res.info.ip,
        date: App.getISODate(),
      });

      App.json( res, true, App.t(['success'], res.lang), {
        user: await App.getModel('User').getCommonDataFromObject(mUser),
        session: {
          token: jwtToken,
        }
      });

    }catch(e){
      console.log(e);
      App.onRouteError( req, res, e );
      // App.json( res, false, App.t('request-could-not-be-processed', req.lang) );
    }

  });

  return { router, method: '', autoDoc:{} };

};


