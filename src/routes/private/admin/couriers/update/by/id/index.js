const express = require('express');
const router = express.Router();

// {
//   "id": "required: <number>: Ref. Courier.id",
//   "firstName": "optional: <string>",
//   "lastName": "optional: <string>",
//   "birthday": "optional: <string> | ISO-8601 e.g. 1995-01-01",
//   "email": "optional: <string>",
//   "phone": "optional: <string>",
//   "cityId": "optional: <string>: Ref. City.id"
// }

// {
//   "id": 2,
//   "firstName": "Slavik",
//   "lastName": "Timoschenko",
//   "birthday": "1988-09-18",
//   "email": "ch3ll0v3k@yandex.com",
//   "phone": "+32498403994",
//   "cityId": 2345
//   "street": "356 Broadway"
// }


// {
//   "id": 4,
//   "phone": "+10000000000",
//   "email": "courier-4.user-23@mail.com",
//   "birthday": "1988-09-18",
//   "cityId": 6,
//   "street": "345 Broadway"
// }

// /private/admin/couriers/update/by/id/

module.exports = function(App, RPath){

  router.use('', async(req, res)=>{

    try{

      const data = req.getPost();
      // const mUser = await req.user; // admin
      const mRestaurant = await req.restaurant;
      const roles = App.getModel('User').getRoles();

      const id = App.getPosNumber(req.getCommonDataInt('id', null));

      if( App.isNull(id) )
        return App.json( res, 417, App.t(['courier','id','is-required'], req.lang) );

      const mCourier = await App.getModel('Courier').findOne({
        where: {
          id,
          isDeleted: false,
          isRestricted: false,
          // isVerified: false,
        },
        include: [{
          model: App.getModel('User'),
          required: true,
          where: {
            isDeleted: false,
            isRestricted: false,
            // role: roles.courier,
            // isEmailVerified: true,
          },
          attributes: [
            'id','email','phone','firstName','lastName','street','cityId',
            'isRestricted','birthday','timezone'
          ],
          // include: [{
          //   required: true,
          //   model: App.getModel('City'),
          //   attributes: ['id','name','stateId'],
          //   include: [{
          //     model: App.getModel('State'),
          //     attributes: ['id','name'],
          //   }]
          // }]
        }],
      });

      if( !App.isObject(mCourier) || !App.isPosNumber(mCourier.id) )
        return App.json( res, 404, App.t(['courier','not-found'], req.lang) );

      // if( mCourier.isRestricted )
      //   return App.json( res, 417, App.t(['courier','is-restricted'], req.lang) );

      // if( mCourier.User.isRestricted )
      //   return App.json( res, 417, App.t(['user','is-restricted'], req.lang) );

      const mUser = mCourier.User;

      const user_t = {
        email: App.tools.normalizeEmail( req.getCommonDataString('email', mUser.email) ),
        phone: App.tools.cleanPhone( req.getCommonDataString('phone', mUser.phone) ),
        firstName: App.tools.cleanName(req.getCommonDataString('firstName', mUser.firstName), false),
        lastName: App.tools.cleanName(req.getCommonDataString('lastName', mUser.lastName), false),
        // birthday: App.DT.moment(req.getCommonDataString('birthday', mUser.birthday)), // .format(App.getDateFormat()),
        birthday: req.getCommonDataString('birthday', mUser.birthday),
        cityId: req.getCommonDataInt('cityId', mUser.cityId),
        // street: req.getCommonDataString('street', mUser.street),
      };

      if( !App.tools.isValidEmail(user_t.email) )
        return App.json(res, 417, App.t(['email','address','is-not','valid'], req.lang));

      if( !App.tools.isValidPhone(user_t.phone) )
        return App.json(res, 417, App.t(['phone','is-not','valid'], req.lang));

      if( !App.isString(user_t.firstName) || !user_t.firstName.length )
        return App.json(res, 417, App.t(['first','name','is-not','valid'], req.lang));

      if( !App.isString(user_t.lastName) || !user_t.lastName.length )
        return App.json(res, 417, App.t(['last','name','is-not','valid'], req.lang));

      if( !App.DT.isValidDatetime(user_t.birthday) )
        return App.json(res, 417, App.t(['birthday','is-not','valid',',','please','use','ISO-8601'], req.lang));        

      if( !App.DT.requireMinAge(user_t.birthday, App.getModel('User').getMinAge()) )
        return App.json(res, 417, App.t('Customer must be at least 13 years old', req.lang));

      // console.log(`mUser.birthday: ${mUser.birthday} => timezone: ${mUser.timezone} `);
      if( user_t.birthday !== mUser.birthday )
        user_t.birthday = App.DT.cleanUpBirthday(user_t.birthday, mUser.timezone );
      // console.log(`user_t.birthday: ${user_t.birthday}`);

      if( !(await App.getModel('City').isset({id: user_t.cityId}) ) )
        return App.json(res, 417, App.t(['city','not-found'], req.lang));

      // if( !App.isString(user_t.street) || !user_t.street.length )
      //   return App.json(res, 417, App.t(['street','address','is-not','valid'], req.lang));

      const doubleRecordRes = await App.getModel('User').findOne({
        where: {
          id: { [App.DB.Op.not]: mUser.id },
          // isVerified: false,
          isDeleted: false,
          isRestricted: false,
          id: { [App.DB.Op.not]: mUser.id },
          [ App.DB.Op.or ]: {
            email: user_t.email,
            phone: user_t.phone,            
          }
        }
      });

      if( App.isObject(doubleRecordRes) && App.isPosNumber(doubleRecordRes.id) ){
        const device = (doubleRecordRes.email===user_t.email?'email':'phone');
        return App.json(res, 417, App.t(['user','with', device ,'already','exists'], req.lang), {doubleRecordRes,mUser});
      }

      // console.json({ [req.path]: {user_t} });
      const updateUser = await mUser.update( user_t );
      if( !App.isObject(updateUser) || !App.isPosNumber(updateUser.id) )
        return App.json( res, false, App.t(['failed-to','update','courier'], req.lang) );

      // console.log(`updateUser.birthday: ${updateUser.birthday}`);
      App.json( res, true, App.t(['courier','has-been','updated'], res.lang), updateUser );

    }catch(e){
      console.log(e);
      App.onRouteError( req, res, e );
      // App.json( res, false, App.t('request-could-not-be-processed', req.lang) );
    }

  });

  return { router, method: '', autoDoc:{} };

};

