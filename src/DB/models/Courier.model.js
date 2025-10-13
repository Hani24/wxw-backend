const { Sequelize, DataTypes, Model } = require('sequelize');

module.exports = async( exportModelWithName, App, params, sequelize )=>{

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
    isOnline: {
      type: DataTypes.BOOLEAN, allowNull: true, defaultValue: false,
    },
    lat: {
      type: DataTypes.DECIMAL(3+8,8), allowNull: true, defaultValue: 0,
    },
    lon: {
      type: DataTypes.DECIMAL(3+8,8), allowNull: true, defaultValue: 0,
    },
    // [verification]
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
    // [verification][request]
    isRequestSent: {
      type: DataTypes.BOOLEAN, allowNull: true, defaultValue: false,
    },
    requestSentAt: {
      type: DataTypes.DATE, allowNull: true, defaultValue: null
    },
    isDeleted: {
      type: DataTypes.BOOLEAN, allowNull: true, defaultValue: false,
    },
    deletedAt: {
      type: DataTypes.DATE, allowNull: true, defaultValue: null
    },
    lastOnlineAt: {
      type: DataTypes.DATE, allowNull: true, defaultValue: null
    },

    // [order][new]
    isOrderRequestSent: {
      type: DataTypes.BOOLEAN, allowNull: true, defaultValue: false,
    },
    orderRequestSentAt: {
      type: DataTypes.DATE, allowNull: true, defaultValue: null
    },
    orderRequestSentByNuid: { // master-node/api-node/: UID
      type: DataTypes.STRING, allowNull: true, defaultValue: null
    },

    // [order][active]
    hasActiveOrder: {
      type: DataTypes.BOOLEAN, allowNull: true, defaultValue: false,
    },
    activeOrderAt: {
      type: DataTypes.DATE, allowNull: true, defaultValue: null
    },
    activeOrderId: {
      type: DataTypes.BIGINT(8).UNSIGNED,
      allowNull: true,
      required: false,
      // onUpdate: 'CASCADE',
      // onDelete: 'CASCADE',
      defaultValue: null,
      references: {
        model: 'Orders',
        key: 'id'
      },
    },
    // /[order][active]

    // [inner][db]
    balance: {
      type: DataTypes.DECIMAL(8,2).UNSIGNED, allowNull: false, defaultValue: 0
    },
    // [inner][stripe]
    personId: { // person_***
      type: DataTypes.STRING, allowNull: true, defaultValue: null
    },
    accountId: { // acct_***
      type: DataTypes.STRING, allowNull: true, defaultValue: null
    },
    isKycCompleted: {
      type: DataTypes.BOOLEAN, allowNull: true, defaultValue: false,
    },
    kycCompletedAt: {
      type: DataTypes.DATE, allowNull: true, defaultValue: null
    },

    // [statistic]
    totalIncome: {
      // all time
      type: DataTypes.DECIMAL(8,2).UNSIGNED, allowNull: true, defaultValue: 0
    },
    totalOrders: {
      type: DataTypes.BIGINT(8).UNSIGNED, allowNull: true, defaultValue: 0,
    },
    totalAcceptedOrders: {
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
    totalRating: {
      type: DataTypes.BIGINT(8).UNSIGNED, allowNull: true, defaultValue: 0,
    },
    avgRating: {
      type: DataTypes.VIRTUAL,
      get(){
        const totalRating = this.getDataValue('totalRating');
        const totalCompletedOrders = this.getDataValue('totalCompletedOrders');
        return ( App.isPosNumber(totalRating) &&  App.isPosNumber(totalCompletedOrders) )
          ? +( totalRating / totalCompletedOrders ).toFixed(2)
          : 0;
      },
      set(){},
    },
    checksum: {
      type: DataTypes.STRING, allowNull: true, defaultValue: '',
      set(){
        if( App.isPosNumber(this.getDataValue('id')) )
          return this.setDataValue('checksum', Model.getChecksum(this));
      }
    },
    isValidChecksum: {
      type: DataTypes.VIRTUAL, 
      get(){
        return ( App.isPosNumber(this.getDataValue('id')) )
          ? Model.getChecksum(this) === this.getDataValue('checksum')
          : false;
      }
    },
  });

  Model.getChecksumKeys = function () {
    return [
      'id', 'userId', 'balance', 'totalIncome', 'totalOrders', 
      'isVerified','isRestricted', 'personId','accountId'
    ];
  }

  Model.getByUserId = async function (userId) {
    if( !App.isPosNumber(Math.floor(+userId)) ) return null;
    userId = Math.floor(+userId);
    return await Model.findOne({
      where: { userId },
    });
  };

  Model.getCommonDataFromObject = async function (mCourier) {
    if( !App.isObject( mCourier ) ) return {};
    return {
      isValidChecksum: mCourier.isValidChecksum,
      id: mCourier.id,
      lat: mCourier.lat,
      lon: mCourier.lon,
      isVerified: mCourier.isVerified,
      isRestricted: mCourier.isRestricted,
      verifiedAt: mCourier.verifiedAt,
      restrictedAt: mCourier.restrictedAt,
      isOnline: mCourier.isOnline,
      balance: mCourier.balance,
      lastOnlineAt: mCourier.lastOnlineAt,
      hasActiveOrder: mCourier.hasActiveOrder,
      activeOrderAt: mCourier.activeOrderAt,
      activeOrderId: mCourier.activeOrderId,
      isRequestSent: mCourier.isRequestSent,
      requestSentAt: mCourier.requestSentAt,
      isKycCompleted: mCourier.isKycCompleted,
      kycCompletedAt: mCourier.kycCompletedAt,
    };
  }

  Model.hasCourierAccount = async function (userId) {
    if( !App.isPosNumber(Math.floor((+userId))) ) return null;
    userId = Math.floor(+userId);
    return await Model.isset({ userId });
  }

  Model.verifyAccess = function (mCourier) {

    if( !App.isObject(mCourier) || !App.isPosNumber(mCourier.id) )
      return {success: false, message: ['courier','not','found'], data: {}};

    if( mCourier.isRestricted )
      return {success: false, message: ['your','account','has-been','restricted'], data: {
        restrictedAt: mCourier.restrictedAt
      }};

    if( !mCourier.isVerified ){
      if( mCourier.isRequestSent )
        // return {success: false, message: ['your','verification','request','is-being','reviewed'], data: {
        return {success: false, message: [
          `Your application for the ${App.getEnv('APP_NAME')} Driver has not yet been confirmed. Please, wait for the approval before you can start receiving orders.`
        ], data: {
          requestSentAt: mCourier.requestSentAt
        }};
      return {success: false, message: ['your','account','is-not','verified'], data: {}};
    }

    return {success: true, message: ['success'], data: {
      verifiedAt: mCourier.verifiedAt
    }};

  }

  return Model;

}
