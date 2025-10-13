const express = require('express');
const router = express.Router();

// {
//   "email": "required: <string>",
//   "password": "required: <string>"
// }

// {
//   "email": "kfc@3dmadcat.ru",
//   "password": "sdfSDF@@@123"
// }

// {
//   "email": "{{EMAIL}}",
//   "password": "{{PASSWORD}}"
// }

// /public/restaurant/login/

module.exports = function(App, RPath){

  router.use('', App.modifiers.noBots, async(req, res)=>{

    try{

      await console.sleep(1500);

      const data = req.getPost();
      const email = App.tools.normalizeEmail(data.email || '');
      const password = App.isString( data.password ) ? data.password.trim() : false;
      const roles = App.getModel('User').getRoles({});
      let mRestaurant = null;

      if( !App.tools.isValidEmail(email) )
        return App.json(res, 417, App.t(['valid','email-address','is-required'], req.lang));

      if( !password )
        return App.json(res, 417, App.t(['valid','password','is-required'], req.lang));

      const mUser = await App.getModel('User').findOne({
	      where: { email, role: roles.restaurant },
      });

      // console.json({mUser});

      if( !App.isObject(mUser) || !App.isPosNumber(mUser.id) )
        return App.json(res, 417, App.t(['account','not','found/verified','and','/','or','wrong','email','/','password'], req.lang));

      if( !(await App.BCrypt.compare(password, mUser.password) ) )
        return App.json(res, 417, App.t(['account','not','found/verified','and','/','or','wrong','email','/','password'], req.lang));

      if( mUser.isRestricted || mUser.isDeleted )
        return App.json( res, 417, App.t(['user','account','is','restricted'], req.lang ));
        // return App.json( res, 417, App.t(['account','is','restricted','or','verification','process','is-not','completed'], req.lang ));

      if( !mUser.isEmailVerified )
        return App.json( res, 417, App.t(['email-verification','is-required'], req.lang));

      if( mUser.role !== roles.restaurant ){

        if(
          ( mUser.role !== roles.manager )
          &&
          ( mUser.role !== roles.employee )
        ){
          return App.json( res, 401, App.t(['account','type','is-not','valid'], req.lang));
        }

        const mWorkerAccount = await App.getModel( App.tools.ucFirst(mUser.role) )
          .findOne({
            where: {
              isDeleted: false,
              userId: mUser.id
            }
          });

        if( !App.isObject(mWorkerAccount) || !App.isPosNumber(mWorkerAccount.id) )
          return App.json( res, 404, App.t([`${mUser.role}`,'account','not','found'], req.lang) );

        if( !mWorkerAccount.isVerified || mWorkerAccount.isRestricted || mWorkerAccount.isDeleted )
          return App.json( res, 417, App.t([`${mUser.role}`,'account','is','restricted','or','verification','process','is-not','completed'], req.lang ));

        // if( !mWorkerAccount.isEmailVerified )
        //   return App.json( res, 417, App.t([`${mUser.role}`,'email-verification','is-required'], req.lang));

        mRestaurant = await App.getModel('Restaurant').getByFields({
          id: mUser.restaurantId,
          isDeleted: false,
          // isRestricted: false,
          // isVerified: true,
        });

      }else{

        mRestaurant = await App.getModel('Restaurant').getByFields({
          userId: mUser.id,
          isDeleted: false,
          // isRestricted: false,
          // isVerified: true,
        });

      }

      // console.json({mRestaurant});

      if( !App.isObject(mRestaurant) || !App.isPosNumber(mRestaurant.id) )
        return App.json( res, 404, App.t(['restaurant','not-found'], req.lang) );

      if( !mRestaurant.isVerified || mRestaurant.isRestricted )
        return App.json( res, 417, App.t(['restaurant','account','is','restricted','and','/','or','is-not','verified'], req.lang ));

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
        restaurantId: mRestaurant.id, 
        sessionId: mSession.id, 
        token: mSession.token,
      //  role: mUser.role, 
        country: res.info.country,
        timezone: res.info.timezone,
        ip: res.info.ip,
        date: App.getISODate(),
      });

      App.json( res, true, App.t(['success'], res.lang), {
        restaurant: mRestaurant.toJSON(),
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


