const express = require('express');
const router = express.Router();

// {
//   "owner": {
//     "email": "required: <string>",
//     "phone": "required: <string>",
//     "firstName": "required: <string>",
//     "lastName": "required: <string>",
//     "password": "required: <string>",
//     "passwordRepeat": "required: <string>"
//   },
//   "restaurant": {
//     "name": "required: <string>",
//     "stateId": "required: <number> Ref. State.id",
//     "cityId": "required: <number> Ref. City.id",
//     "address": "required: <string> full-address: eg: 346 Broadway 3 34",
//     "type": "required: ENUM: <string>: [ mobile | stationary ]",
//     "website": "required: <string>",
//     "comment": "optional: <string>"
//   }
// }

// California => 6 => Woodlake => 768 => 24 Walnut St
// california => Adelanto => 10968 Chamberlaine Way => CA 92301 => USA

// {
//   "owner": {
//     "email": "",
//     "phone": "+32498010101",
//     "firstName": "Resto",
//     "lastName": "Bob",
//     "password": "{{PASSWORD}}",
//     "passwordRepeat": "{{PASSWORD}}"
//   },
//   "restaurant": {
//     "name": "required: <string>",
//     "stateId": 6,
//     "cityId": 768,
//     "address": "24 Walnut street",
//     "type": "stationary",
//     "website": "https://resto-bob.resto",
//     "comment": "comment"
//   }
// }


// /public/restaurant/sign-up/

module.exports = function(App, RPath){

  router.use('', App.modifiers.noBots, async(req, res)=>{

    try{

      await console.sleep(1500);

      req.body = {
        // ...req.getPost(),
        ...req.getPost().owner,
        ...req.getPost().restaurant,
      };

      const roles = App.getModel('User').getRoles({asArray: false});
      const restoTypes = App.getModel('Restaurant').getTypes({asArray: false});

      const owner_t = {
        email: App.tools.normalizeEmail( req.getCommonDataString('email', '').trim() ),
        phone: App.tools.cleanPhone( req.getCommonDataString('phone', '').trim() ),
        firstName: req.getCommonDataString('firstName', '').trim(),
        lastName: req.getCommonDataString('lastName', '').trim(),
        password: req.getCommonDataString('password', '').trim(),
        role: roles.restaurant,
      };

const fullAddress = req.getCommonDataString('address', '').trim();

      const restaurant_t = {
        timezone: res.info.timezone,
        name: req.getCommonDataString('name', '').trim(),
        stateId: req.getCommonDataInt('stateId', 0),
        cityId: req.getCommonDataInt('cityId', 0),
        street: req.getCommonDataString('address', '').trim(),
        type: req.getCommonDataString('type', '').trim(),
        website: req.getCommonDataString('website', '').trim(),
        comment: req.getCommonDataString('comment', '').trim(),
        // isVerified: false,
        // verifiedAt: App.getISODate(),
        isOpen: true,
        lat: 0,
        lon: 0,
      };

      // [user]
      if( !App.tools.isValidEmail( owner_t.email ) )
        return App.json(res, 417, App.t(['email','address','is-not','valid'], req.lang));

      if( (await App.getModel('User').isset({ email: owner_t.email, role: 'restaurant' })) )
        return App.json(res, 417, App.t(['user-with-email-already-exists'], req.lang));

      if( (await App.getModel('User').isset({ phone: owner_t.phone, role: 'restaurant' })) )
        return App.json(res, 417, App.t(['user-with-phone-already-exists'], req.lang));

      if( !App.tools.isValidPhone(owner_t.phone) )
        return App.json(res, 417, App.t(['phone','number','is-not','valid'], req.lang));

      const fullName = App.tools.cleanName(`${owner_t.firstName} ${owner_t.lastName}`, true, true );
      if( !fullName )
        return App.json(res, 417, App.t(['please','provide','first','and','last','name'], req.lang));

      if( !restaurant_t.name )
        return App.json(res, 417, App.t(['restaurant','name','is-required'], req.lang));

      if( !restaurant_t.street )
        return App.json(res, 417, App.t(['restaurant','address','is-not','valid'], req.lang));

      if( !App.tools.isValidPassword(owner_t.password) )
        return App.json(res, 417, App.t(['password-must-be...'], req.lang));

      if( owner_t.password !== req.getCommonDataString('passwordRepeat', '<none>').trim() )
        return App.json(res, 417, App.t(['password-does-not-match'], req.lang));

      // [restaurant]
      if( !(await App.getModel('City').isset({ id: restaurant_t.cityId, stateId: restaurant_t.stateId })) )
        return App.json(res, 417, App.t(['state','and','city','is-required'], req.lang));

      const mCity = await App.getModel('City').getByFields({ id: restaurant_t.cityId });
      const mState = await App.getModel('State').getByFields({ id: restaurant_t.stateId });

      if( !restoTypes.hasOwnProperty(restaurant_t.type) )
        return App.json(res, 417, App.t(['restaurant','type','is-required'], req.lang));




const street = fullAddress.split(',')[0].trim();
restaurant_t.street = street;

console.log('Attempting geocoding with:', {
  country: 'US',
  state: mState.name,
  city: mCity.name,
  street: restaurant_t.street
});



      const geoRes = await App.geo.tools.getCoordsFromAddress({
	state: mState.name, 
        city: mCity.name, 
        street: restaurant_t.street,
      });

console.log('Geocoding response:', geoRes);

      if( !geoRes.success ){
        console.json({geoRes});
 console.error('Geocoding failed:', geoRes);
        return App.json(res, 417, App.t(geoRes.message, req.lang));
      }

      restaurant_t.lat = geoRes.data.lat;
      restaurant_t.lon = geoRes.data.lon;

      // allow same name ???
      // if( !(await App.getModel('Restaurant').isset({ name: restaurant_t.name })) )
      //   return App.json(res, 417, App.t(['restaurant','name','is','already','taken'], req.lang));

      const code = App.BCrypt.randomSecureToken(12); // 64^12 => 
      // auto-gen: password (old version)
      const password = await App.BCrypt.randomSecureToken(12);
      // const hash = await App.BCrypt.hash( password );
      const hash = await App.BCrypt.hash( owner_t.password );
      owner_t.password = hash;

      let mOrder = null;
      let ORDER_ID_LOCK = null;
      let mUser = null;
      let mRestaurant = null;

      const tx = await App.DB.sequelize.transaction( App.DB.getTxOptions() );

      try{

        mUser = await App.getModel('User').create({
          ...owner_t
        }, {transaction: tx});

        if( !App.isObject(mUser) || !App.isPosNumber(mUser.id) ){
          await tx.rollback();
          return App.json( res, false, App.t(['Failed to create owner account'], req.lang));
        }

        mRestaurant = await App.getModel('Restaurant').create({
          userId: mUser.id,
          ...restaurant_t,
        }, {transaction: tx});

        if( !App.isObject(mRestaurant) || !App.isPosNumber(mRestaurant.id) ){
          await tx.rollback();
          return App.json( res, false, App.t(['Failed to create restaurant account'], req.lang));
        }

        mUser = await mUser.update({
          restaurantId: mRestaurant.id,
        }, {transaction: tx});

        if( !App.isObject(mUser) || !App.isPosNumber(mUser.id) ){
          await tx.rollback();
          return App.json( res, false, App.t(['Failed to assign restaurant to the account'], req.lang));
        }

        const mEmailVerification = await App.getModel('EmailVerification').create({
          userId: mUser.id,
          email: mUser.email,
          code: code,
        }, {transaction: tx});

        if( !App.isObject(mEmailVerification) || !App.isPosNumber(mEmailVerification.id) ){
          await tx.rollback();
          return App.json( res, false, App.t(['Failed to send create verification'], req.lang));
        }

        const emailVerificationRes = await App.Mailer.send({
          to: mUser.email,
          subject: App.t('email-verification', req.lang),
          data: await App.Mailer.createEmailTemplate('restaurant-email-verification', { 
            lang: req.lang,
            code: code,
            platform: 'web',
            webPath: App.toAppPath( 'web', 'restaurant.email-verification-verify', code),
          })
        });

        if( !emailVerificationRes.success ){
          await tx.rollback();
          return App.json( res, false, App.t(['Failed to send email verification'], req.lang));
        }

        const clientInfo = {
          firstName: mUser.firstName,
          lastName: mUser.lastName,
          email: mUser.email,
          phone: mUser.phone, // only US based number
          birthday: mUser.birthday || '1999-01-01T12:00:00',
          metadata: {
            userId: mUser.id,
            courierId: mRestaurant.id,
          }
        };

        const addressInfo = {
          state: mState.name, // mCity.State.name,
          city: mCity.name, // mCity.name,
          zip: '', // mUser.zip,
          street: restaurant_t.street, // mUser.street,
        };

        const stripeAccountRes = await App.payments.stripe.accountCreate(
          clientInfo, addressInfo, {ip: res.info.ip }
        );
        if( !stripeAccountRes.success )
          console.error(` #stripeAccountRes: [userId: ${mUser.id}, courierId: ${mRestaurant.id}] ${stripeAccountRes.message} `);

        if( !stripeAccountRes.success ){
          return await App.renderUI( res, 'message', {
            message: App.t(['Failed to','update','external','account.'], req.lang, ''),
            message: App.t([stripeAccountRes.message], req.lang),
            icon: { name: 'error', size: 100 },
          });
        }

        const accountId = stripeAccountRes.data.id; //  === acct_***;
        const personId = stripeAccountRes.data.individual.id; //  === person_***;

        mRestaurant = await mRestaurant.update({
          accountId,
          personId,
          // checksum: true,
        }, {transaction: tx});

        if( !App.isObject(mRestaurant) || !App.isPosNumber(mRestaurant.id) ){
          await tx.rollback();
          return App.json( res, false, App.t(['Failed to update restaurant account'], req.lang));
        }

        await tx.commit();
        console.line();
        console.log(` #restaurant: ${mRestaurant.id}:${mRestaurant.name} => #user: ${mUser.id}:${mUser.email}:${mUser.phone}`);
        console.log(` #stripe: account: ${accountId} => #person: ${personId}`);

      }catch(e){
        console.error(e);
        await tx.rollback();
        return App.json( res, false, App.t(['Failed to create restaurant account'], req.lang));
      }

      await App.json( res, true, App.t(['verification-email-has-been-sent'], req.lang));

      // auto-created ...

      await mRestaurant.update({ checksum: true });
      const mUserSettings = await App.getModel('UserSettings').getByUserId( mUser.id );

      // [post-processing]

      // const stripeCustomerCreate = await App.payments.stripe.customerCreate({
      //   email: mUser.email,
      //   name: `${mUser.firstName} ${mUser.lastName}`,
      //   description: `new restaurant: ${mRestaurant.name}`,
      //   metadata: {
      //     userId: mUser.id,
      //     restaurantId: mRestaurant.id,
      //   }
      // });
      // if( !stripeCustomerCreate.success ) console.json({stripeCustomerCreate});

      // const stripeAccountRes = await App.payments.stripe.accountGetById( mRestaurant.accountId || 'n/a' );
      // stripeAccountRes = await App.payments.stripe.customerUpdateById(
      //   mRestaurant.accountId, clientInfo, addressInfo, {ip: res.info.ip }
      // );
      // if( !stripeAccountRes.success )
      //   console.error(` #stripeAccountRes: [userId: ${mUser.id}, courierId: ${mRestaurant.id}] ${stripeAccountRes.message} `);

    }catch(e){
      console.log(e);
      App.onRouteError( req, res, e );
      // App.json( res, false, App.t('request-could-not-be-processed', req.lang) );
    }

  });

  return { router, method: '', autoDoc:{} };

};


