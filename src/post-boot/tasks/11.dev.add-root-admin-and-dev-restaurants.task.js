
module.exports = async (App, params={}, task='')=>{

  try{


    // dev-data
    return true;
    console.ok(` #post-boot: [${task}]: start: `);

    const DOMAIN = App.getEnv('DOMAIN');

    if( (await App.getModel('User').isset({email: `root@${DOMAIN}`})) )
      return true;

    const mRootUser = await App.getModel('User').create({
      email: `root@${DOMAIN}`,
      isEmailVerified: true,
      phone: '+0000000001',
      isPhoneVerified: true,
      isRestricted: false,
      password: '$2b$10$Ay6UbjCJNVofD0pwstWVPuJVZkefoT.xN1NejirShAujbHRtSjw0u',
      lang: 'en',
      role: 'root', // roles.restaurant,
      gender: 'not-selected',
      img: 'default.male.png',
      firstName: 'Admin-User',
      lastName: '',
      cityId: 345,
      zip: '',
      street: '',
      birthday: '1988-09-18T00:00:00.000Z',
      timezone: 'n/a',
      lastSeenAt: '2021-06-15T00:29:39.000Z',
      createdAt: '2021-06-14T23:22:02.000Z',
      updatedAt: '2021-06-15T00:29:39.000Z',    
    });

    const mAdminUser = await App.getModel('User').create({
      email: `admin@${DOMAIN}`,
      isEmailVerified: true,
      phone: '+0000000002',
      isPhoneVerified: true,
      isRestricted: false,
      password: '$2b$10$Ay6UbjCJNVofD0pwstWVPuJVZkefoT.xN1NejirShAujbHRtSjw0u',
      lang: 'en',
      role: 'admin', // roles.restaurant,
      gender: 'not-selected',
      img: 'default.male.png',
      firstName: 'Super',
      lastName: 'Admin',
      cityId: 345,
      zip: '',
      street: '',
      birthday: '1988-09-18T00:00:00.000Z',
      timezone: 'n/a',
      lastSeenAt: '2021-06-15T00:29:39.000Z',
      createdAt: '2021-06-14T23:22:02.000Z',
      updatedAt: '2021-06-15T00:29:39.000Z',    
    });

    const restoUsers = [
      { email: 'mcdonalds@morris-armstrong-ii-dev.ru', firstName: 'Resto', lastName: 'McDonalds', type: 'stationary' },
      { email: 'kfc@morris-armstrong-ii-dev.ru', firstName: 'Resto', lastName: 'KFC', type: 'stationary' },
      { email: 'food-truck-a@morris-armstrong-ii-dev.ru', firstName: 'Resto', lastName: 'food-truck-a', type: 'mobile' },
    ];

    const tmpl = {
      owner: {
        email: '',
        phone: '',
        firstName: '',
        lastName: '',
        isPhoneVerified: 1, 
        isEmailVerified: 1,
        role: 'restaurant',
        password: await App.BCrypt.hash('sdfSDF@@@123'),
        lat: '34.0681465',
        lon: '-118.2916571',
      },
      restaurant: {
        name: '',
        stateId: 6,
        cityId: 768,
        address: '24 Walnut street',
        type: '',
        website: '',
        comment: 'info ...',
        isOpen: true,
        lat: '34.0681465',
        lon: '-118.2916571',
        isVerified: true,
        verifiedAt: App.getISODate(),
        isKycCompleted: false, // true,
        kycCompletedAt: null, // App.getISODate(),
      }
    };

    const mCity = await App.getModel('City').getByFields({ id: tmpl.restaurant.cityId });
    const mState = await App.getModel('State').getByFields({ id: tmpl.restaurant.stateId });

    for( const i in restoUsers ){

      const type = restoUsers[i].type;
      delete restoUsers[i].type;

      const owner_t = {
        ...tmpl.owner,
        ...restoUsers[i],
        phone: `+000000000${i+3}`,
      };

      const restaurant_t = {
        ...tmpl.restaurant,
        type,
        name: restoUsers[i].lastName,
        website: `https://resto.${restoUsers[i].firstName}.${restoUsers[i].lastName}.com` 
      };

      let mUser = await App.getModel('User').create({
        ...owner_t
      });

      if( !App.isObject(mUser) || !App.isPosNumber(mUser.id) ){
        console.log(` error: user`);
        continue;
      }

      let mRestaurant = await App.getModel('Restaurant').create({
        userId: mUser.id,
        ...restaurant_t,
      });

      if( !App.isObject(mRestaurant) || !App.isPosNumber(mRestaurant.id) ){
        console.log(` error: resto`);
        continue;
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
        clientInfo, addressInfo, {ip: '127.0.0.1' }
      );
      if( !stripeAccountRes.success )
        console.error(` #stripeAccountRes: [userId: ${mUser.id}, courierId: ${mRestaurant.id}] ${stripeAccountRes.message} `);

      if( !stripeAccountRes.success ){
        console.error(App.t(['Failed to','update','external','account.']));
        continue;
      }

      const accountId = stripeAccountRes.data.id; //  === acct_***;
      const personId = stripeAccountRes.data.individual.id; //  === person_***;

      mRestaurant = await mRestaurant.update({
        accountId,
        personId,
      });

      if( !App.isObject(mRestaurant) || !App.isPosNumber(mRestaurant.id) ){
        console.log(` error: resto: accountId: ${accountId}, personId: ${personId}`);
        continue;
      }

      console.ok(` #stripeAccountRes: [userId: ${mUser.id}, restaurantId: ${mRestaurant.id}, accountId: ${accountId}, personId: ${personId}] ${stripeAccountRes.message} `);

    }

    console.ok(` #post-boot: [${task}]: done`);
    return true;

  }catch(e){
    console.error(` #post-boot: [${task}]: ${e.message}`);
    console.error(e);
    return false;
  }

}