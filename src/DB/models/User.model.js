const { Sequelize, DataTypes, Model } = require('sequelize');

module.exports = async( exportModelWithName, App, params, sequelize )=>{

  const USER_ROLES = App.getDictByName('USER_ROLES');
  const USER_LANGS = App.getDictByName('USER_LANGS');
  const USER_GENDERS = App.getDictByName('USER_GENDERS');
  const MONTHS = App.getDictByName('MONTHS');
  const MIN_AGE = 13; // TODO: mode to DB ??? 

  const Model = sequelize.define( exportModelWithName, {
    // [manager || employee] of restaurant
    restaurantId: {
      type: DataTypes.BIGINT(8).UNSIGNED,
      allowNull: true,
      required: false,
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
      references: {
        model: 'Restaurants',
        key: 'id'
      },
    },
    cityId: {
      type: DataTypes.BIGINT(8).UNSIGNED,
      allowNull: true,
      required: false,
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
      references: {
        model: 'Cities',
        key: 'id'
      },
    },
    isNewUser: {
      type: DataTypes.BOOLEAN, allowNull: true, defaultValue: true
    },
    isGuest: {
      type: DataTypes.BOOLEAN, allowNull: true, defaultValue: false
    },
    guestToken: {
      type: DataTypes.STRING(64), allowNull: true, defaultValue: null,
    },
    guestExpiresAt: {
      type: DataTypes.DATE, allowNull: true, defaultValue: null,
    },
    // email: {
    //   type: DataTypes.STRING, allowNull: false, unique: true,
    // },
    email: {
      type: DataTypes.STRING, allowNull: true, defaultValue: null, //unique: true,
    },
    isEmailVerified: {
      type: DataTypes.BOOLEAN, allowNull: true, defaultValue: false,
    },
    phone: {
      type: DataTypes.STRING, allowNull: true, defaultValue: null, unique: false,
    },
    isPhoneVerified: {
      type: DataTypes.BOOLEAN, allowNull: true, defaultValue: false,
    },
    password: {
      type: DataTypes.STRING, allowNull: false,
    },
    lang: {
      type: DataTypes.STRING, allowNull: true, defaultValue: USER_LANGS[0],
    },
    role: {
      type: Sequelize.ENUM, required: true, values: USER_ROLES,
      defaultValue: USER_ROLES[ 0 ],
    },
    gender: {
      type: Sequelize.ENUM, required: true, values: USER_GENDERS,
      defaultValue: USER_GENDERS[ 0 ],
    },
    image: {
      type: DataTypes.STRING, allowNull: true, defaultValue: 'default.male.png',
      get(){
        return App.S3.getUrlByName( this.getDataValue('image') );
      },
      set(image_t){
        this.setDataValue('image', !App.isString(image_t)
          ? ''
          : image_t.split('/').length >= 3
            ? image_t.split('/').pop().trim()
            : image_t
        );
      },
    },
    firstName: {
      type: DataTypes.STRING, allowNull: true, defaultValue: '',
      // get(){
      //   const firstName = this.getDataValue('firstName');
      //   return ( !App.isString(firstName) || !firstName.length )
      //     ? 'not'
      //     : firstName;
      // }
    },
    lastName: {
      type: DataTypes.STRING, allowNull: true, defaultValue: '',
      // get(){
      //   const lastName = this.getDataValue('lastName');
      //   return ( !App.isString(lastName) || !lastName.length )
      //     ? 'not'
      //     : lastName;
      // }
    },
    fullName: {
      type: DataTypes.VIRTUAL,
      get(){
        const firstName = this.getDataValue('firstName');
        const lastName = this.getDataValue('lastName');
        if( 
          (!App.isString(firstName) || !firstName.length)
          ||
          (!App.isString(lastName) || !lastName.length)
        ){
          return 'not set';
        }
        return`${firstName} ${lastName}`;
      },
      set(){},
    },
    // country: {
    //   type: DataTypes.STRING, allowNull: true, defaultValue: '',
    // },
    // city: {
    //   type: DataTypes.STRING, allowNull: true, defaultValue: '',
    // },
    // region: {
    //   type: DataTypes.STRING, allowNull: true, defaultValue: '',
    // },
    zip: {
      type: DataTypes.STRING, allowNull: true, defaultValue: '',
    },
    street: {
      type: DataTypes.STRING, allowNull: true, defaultValue: '',
    },
    birthday: {
      type: DataTypes.DATE, allowNull: true, defaultValue: null,
      // get(){
      //   const birthday = this.getDataValue('birthday');
      //   return App.DT.isValidDatetime( birthday )
      //     ? birthday
      //     : App.getISODate();
      // },
    },
    timezone: {
      type: DataTypes.STRING, allowNull: true, defaultValue: 'n/a',
    },
    lastSeenAt: {
      type: DataTypes.DATE, 
      allowNull: false, defaultValue: DataTypes.NOW
    },
    isRestricted: {
      type: DataTypes.BOOLEAN, allowNull: true, defaultValue: false,
    },
    restrictedAt: {
      type: DataTypes.DATE, allowNull: true, defaultValue: null,
    },
    isDeleted: {
      type: DataTypes.BOOLEAN, allowNull: true, defaultValue: false,
    },
    deletedAt: {
      type: DataTypes.DATE, allowNull: true, defaultValue: null
    },
    // [root/admin]
    lat: {
      type: DataTypes.DECIMAL(3+8,8), allowNull: true, defaultValue: 0,
    },
    lon: {
      type: DataTypes.DECIMAL(3+8,8), allowNull: true, defaultValue: 0,
    },
  });

  Model.getRoles = function ({asArray=false}={}) {
    return Model._mapDict(USER_ROLES, {asArray} );
  };

  Model.getLangs = function ({asArray=false}={}) {
    return Model._mapDict(USER_LANGS, {asArray} );
  };

  Model.getGenders = function ({asArray=false}={}) {
    return Model._mapDict(USER_GENDERS, {asArray} );
  };

  Model.getByOrCreateWith = async function (where, data) {
    const mUser = await Model.findOne({ where });
    return App.isObject(mUser)
      ? mUser
      : await Model.create( data );
  };

  Model.getByEmail = async function (email) {
    email = App.tools.normalizeEmail(email);
    if( !App.isString(email) || !App.tools.isValidEmail(email) ) return false;
    return await Model.findOne({
      where: { email },
    });
  };

  Model.getMinAge = function () { return MIN_AGE; };

  Model.getByUserId = async function (userId, onlyValid=false) {
    if( !App.isPosNumber(Math.floor((+userId))) ) return null;

    const roles = App.getModel('User').getRoles();

    const where = {
      id: Math.floor((+userId)),
    };

    if( onlyValid ){
      // role: roles.employee,
      // where.isVerified = true;
      // where.verifiedAt = App.getISODate();
      where.isRestricted = false;
      // where.restrictedAt = null;
      where.isDeleted = false;
      // where.deleteddAt = null;
    }

    return await Model.findOne({
      where,
    });
  };

  Model.getCommonDataFromObject = async function (mUser) {
    if( !App.isObject( mUser ) ) return {};

    const mCity = await App.getModel('City').getById( mUser.cityId );
    const mState = await App.getModel('State').findOne({ where:{ id: App.isObject(mCity) ? mCity.stateId : -1 } });
    const hasCourierAccount = await App.getModel('Courier').isset({ userId: mUser.id });

    const mDate = new Date(mUser.birthday); // .split('T')
    const birthday = `${mDate.getDate()} ${ MONTHS[ mDate.getMonth() ] } ${mDate.getFullYear()}`;
    const roles = Model.getRoles({asArray: false});

    return {
      id: mUser.id,
      email: mUser.email,
      isEmailVerified: mUser.isEmailVerified,
      phone: mUser.phone,
      isPhoneVerified: mUser.isPhoneVerified,
      isRestricted: mUser.isRestricted,
      isManager: (mUser.role === roles.manager),
      isEmployee: (mUser.role === roles.employee),
      hasCourierAccount,
      lang: mUser.lang,
      role: mUser.role,
      gender: mUser.gender,
      image: App.S3.getUrlByName(mUser.image),
      fullName: mUser.fullName,
      firstName: mUser.firstName,
      lastName: mUser.lastName,
      stateId: (App.isObject(mState) ? mState.id : null),
      state: (App.isObject(mState) ? mState.name : null),
      cityId: (mUser.cityId || null),
      city: (App.isObject(mCity) ? mCity.name : ''),
      zip: mUser.zip,
      street: mUser.street,
      isNewUser: mUser.isNewUser,
      birthdayIso: mUser.birthday,
      birthday: birthday,
      timezone: mUser.timezone,
      lastSeenAt: mUser.lastSeenAt,
    }
  };

  return Model;

}
