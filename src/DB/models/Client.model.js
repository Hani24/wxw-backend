const { Sequelize, DataTypes, Model } = require('sequelize');

module.exports = async( exportModelWithName, App, params, sequelize )=>{

  const CLIENT_EVENTS = App.getDictByName('CLIENT_EVENTS');

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
    isVerified: {
      type: DataTypes.BOOLEAN, allowNull: true, defaultValue: false,
    },
    verifiedAt: {
      type: DataTypes.DATE, allowNull: true, defaultValue: null
    },
    isRestricted: {
      type: DataTypes.BOOLEAN, allowNull: true, defaultValue: false,
    },
    restrictedAt: {
      type: DataTypes.DATE, allowNull: true, defaultValue: null
    },
    isDeleted: {
      type: DataTypes.BOOLEAN, allowNull: true, defaultValue: false,
    },
    deletedAt: {
      type: DataTypes.DATE, allowNull: true, defaultValue: null
    },
    lat: {
      type: DataTypes.FLOAT, allowNull: true, defaultValue: 0,
    },
    lon: {
      type: DataTypes.FLOAT, allowNull: true, defaultValue: 0,
    },
    // [inner][stripe]
    customerId: {
      type: DataTypes.STRING, allowNull: true, defaultValue: null
    },
    // [statistic]
    totalSpend: {
      type: DataTypes.DECIMAL(8,2).UNSIGNED, allowNull: true, defaultValue: 0
    },
    totalOrders: {
      type: DataTypes.BIGINT(8).UNSIGNED, allowNull: true, defaultValue: 0,
    },
    totalRejectedOrders: {
      type: DataTypes.BIGINT(8).UNSIGNED, allowNull: true, defaultValue: 0,
    },
    totalCanceledOrders: {
      type: DataTypes.BIGINT(8).UNSIGNED, allowNull: true, defaultValue: 0,
    },
    totalCompletedOrders:{
      type: DataTypes.BIGINT(8).UNSIGNED, allowNull: false, defaultValue: 0,
    },
    // avgRating: {
    //   type: DataTypes.VIRTUAL,
    //   get(){
    //     const totalRating = this.getDataValue('totalRating');
    //     const totalCompletedOrders = this.getDataValue('totalCompletedOrders');
    //     return ( App.isPosNumber(totalRating) &&  App.isPosNumber(totalCompletedOrders) )
    //       ? +( totalRating / totalCompletedOrders ).toFixed(2)
    //       : 0;
    //   },
    //   set(){},
    // },
  });

  Model.getEvents = function ({asArray=false}={}) {
    return console.deepClone(CLIENT_EVENTS);
    // return Model._mapDict(CLIENT_EVENTS, {asArray} );
  };

  Model.getByUserId = async function (userId) {
    if( !App.isPosNumber(Math.floor(+userId)) ) return null;
    userId = Math.floor(+userId);
    return await Model.findOne({
      where: { userId },
    });
  };

  Model.getCommonDataFromObject = async function (mClient) {
    if( !App.isObject( mClient ) ) return {};
    // const mCity = await App.getModel('City').getById({id: mClient.cityId});
    return {
      id: mClient.id,
      isVerified: mClient.isVerified,
      isRestricted: mClient.isVerified,
      verifiedAt: mClient.verifiedAt,
      restrictedAt: mClient.restrictedAt,          
      hasCourierAccount: await App.getModel('Courier').hasCourierAccount(mClient.userId),
      lat: mClient.lat,          
      lon: mClient.lon,          
    };
  }

  return Model;

}
