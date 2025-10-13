const { Sequelize, DataTypes, Model } = require('sequelize');

module.exports = async( exportModelWithName, App, params, sequelize )=>{

  const PLATFORMS = App.getDictByName('PLATFORMS');

  const Model = sequelize.define( exportModelWithName, {
    userId: {
      type: DataTypes.BIGINT(8).UNSIGNED,
      allowNull: false,
      required: true,
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
      references: {
        model: 'Users',
        key: 'id'
      },
    },
    token: {
      type: DataTypes.STRING, allowNull: false, required: true,
    },
    maxAge: {
      type: DataTypes.INTEGER(11).UNSIGNED, allowNull: true, defaultValue: 0,
    },
    fcmPushToken: {
      type: DataTypes.STRING, allowNull: true, defaultValue: '', 
    },
    country: {
      type: DataTypes.STRING, allowNull: true, defaultValue: 'n/a',
    },
    timezone: {
      type: DataTypes.STRING, allowNull: true, defaultValue: 'n/a',
    },
    ip: {
      type: DataTypes.STRING, allowNull: true, defaultValue: 'n/a',
    },
    isDeleted: {
      type: DataTypes.BOOLEAN, allowNull: true, defaultValue: false,
    },
    deviceId: {
      type: DataTypes.STRING, allowNull: true, defaultValue: '',
    },
  });

  Model.getPlatforms = function ({asArray=false}={}) {
    return Model._mapDict(PLATFORMS, {asArray} );
  };

  Model.getByUserId = async function (id) {
    return await Model.findOne({ where:{ userId: id } })
  };

  Model.getByToken = async function (token) {
    return await Model.findOne({ where:{ token } })
  };

  Model.getOrCreate = async function ( {
    userId=false, country='n/a', timezone='n/a', ip=false, maxAge=false,
    deviceId='', isDeleted=false,
  }={} ) {

    const session_t = {
      userId: App.isPosNumber( +userId ) ? (+userId) : null,
      country: App.isString( country ) && country.length ? country : 'n/a',
      timezone: App.isString( timezone ) && timezone.length ? timezone : 'n/a',
      deviceId: App.isString( deviceId ) && deviceId.length ? deviceId : '',
      ip: App.isString( ip ) ? ip : 'n/a',
      // maxAge: App.isPosNumber( +maxAge ) ? (+maxAge) : ( (60*60*24)*30 * 1000 ), 
      isDeleted,
    };

    for( const mKey of Object.keys(session_t) )
      if( App.isNull(session_t[ mKey ]) )
        return { success: false, message: [`[${mKey}]`,'is-required'], data: {} };

    let mSession = await App.getModel('Session').findOne({
      where: session_t,
      order: [['id','desc']]
    });

    if( App.isObject(mSession) && App.isPosNumber(mSession.id) )
      return { success: true, message: ['success'], data: mSession };

    const token = App.BCrypt.randomSecureToken(32);
    maxAge = maxAge || App.isPosNumber( +maxAge ) ? (+maxAge) : ( (60*60*24)*30 * 1000 );

    mSession = await App.getModel('Session').create({
      ...session_t,
      token,
      maxAge,
    });

    if( !App.isObject(mSession) || !App.isPosNumber(mSession.id) )
      return { success: false, message: ['could-not','create','session'], data: {} };

    return { success: true, message: ['success'], data: mSession };

  };

  Model.getAllRecentFcmTokens = async function () {

    try{

      return { success: false, message: ['disabled'], data: {} };

      const query = `
        select S.id, S.userId, S.deviceId, S.fcmPushToken as fcm 
          from Sessions as S 
        inner join UserSettings as US
          on US.userId = S.userId
        where 
          S.fcmPushToken is not null 
          and 
          S.fcmPushToken != ''
          and 
          S.deviceId is not null 
          and 
          S.deviceId != ''
          and
          S.isDeleted = 0
          and 
          US.allowSendNotification = 1
          -- and 
          -- S.id = ( select max(id) from Sessions where userId = S.userId and fcmPushToken != '' and fcmPushToken is not null and isDeleted = 0 )
          -- group by S.userId
          group by S.deviceId
          order by S.userId desc
      ;`;

      // group by S.userId order by S.userId asc;`;
      // group by S.userId order by S.userId asc;
      //  and S.fcmPushToken != '' and S.fcmPushToken is not null and isDeleted=0

      const fcmsRecs = await App.DB.sequelize.query( query, {
        type: App.DB.QueryTypes.SELECT,
        nest: true,
      });

      // const devices = {};
      // fcmsRecs.map((mFcm)=>{
      //   if( App.isUndefined(devices[ mFcm.deviceId ]) )
      //     devices[ mFcm.deviceId ] = [];
      //   devices[ mFcm.deviceId ].push( mFcm );
      // });

      // return { success: false, message: ['break'], data: {} };
      return { success: true, message: ['success'], data: fcmsRecs /* devices, fcmsRecs */ };

    }catch(e){
      console.error(` #Session.getAllRecentFcmTokens(void): ${e.message}`);
      return { success: false, message: e.message, data: {} };
    }

  };

  Model.getAllRecentFcmTokensByUserId = async function ( id ) {

    try{

      id = App.isPosNumber( +id ) ? (+id) : false;

      if( !id )
        return { success: false, message: ['user','id','is-required'], data: [] };

      const mUser = await App.getModel('User').getById( id );
      if( !App.isObject(mUser) || !App.isPosNumber( mUser.id ) )
        return { success: false, message: ['user','not-found'], data: [] };

      const query = `
        select S.id, S.userId, S.deviceId, S.fcmPushToken as fcm 
          from Sessions as S 
        inner join UserSettings as US
          on US.userId=${ mUser.id }
        where 
          S.userId=${ mUser.id } 
          and 
          S.fcmPushToken is not null 
          and 
          S.fcmPushToken != ''
          and 
          S.deviceId is not null 
          and 
          S.deviceId != ''
          and
          S.isDeleted = 0
          and 
          US.allowSendNotification = 1
          -- and 
          -- S.id = ( select max(id) from Sessions where userId = S.userId and fcmPushToken != '' and fcmPushToken is not null and isDeleted=0)
        -- group by S.userId
        -- group by S.deviceId
        order by S.id desc
      ;`; //  order by S.id desc

      const fcmsRecs = await App.DB.sequelize.query( query, {
        type: App.DB.QueryTypes.SELECT,
        nest: true,
      });

      const devices = {};
      fcmsRecs.map((mFcm)=>{
        if( App.isUndefined(devices[ mFcm.deviceId ]) )
          devices[ mFcm.deviceId ] = [];
        console.log(` #userId: ${mFcm.userId} => deviceId: ${mFcm.deviceId}, token: ${mFcm.fcm.substr(0, 12)}...`);
        devices[ mFcm.deviceId ].push( mFcm );
      });

      return { success: true, message: ['success'], data: devices /* fcmsRecs */ };

    }catch(e){
      console.error(` #Session.getAllRecentFcmTokensByUserId( <number>: ${id} ): ${e.message}`);
      return { success: false, message: e.message, data: {} };
    }

  };

  return Model;

}
