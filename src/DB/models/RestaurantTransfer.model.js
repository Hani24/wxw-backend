const { Sequelize, DataTypes, Model } = require('sequelize');

module.exports = async( exportModelWithName, App, params, sequelize )=>{

  const TRANSFER_STATUSES = App.getDictByName('TRANSFER_STATUSES');

  const Model = sequelize.define( exportModelWithName, {
    restaurantId: {
      type: DataTypes.BIGINT(8).UNSIGNED,
      allowNull: false,
      required: true,
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
      references: {
        model: 'Restaurants',
        key: 'id'
      },
    },
    status: {
      type: Sequelize.ENUM, required: true, values: TRANSFER_STATUSES,
      defaultValue: TRANSFER_STATUSES[ 0 ],
    },
    amount: {
      type: DataTypes.DECIMAL(8,2), allowNull: false, defaultValue: 0
    },
    // [stripe:owner] to [stripe:restaurant]
    isTransfered: {
      type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false
    },
    transferedAt: {
      type: DataTypes.DATE, allowNull: true, defaultValue: null
    },
    // [stripe]:[internal]:[external]    
    transferId: {
      type: DataTypes.STRING, allowNull: true, defaultValue: null
    },
    transferError: {
      type: DataTypes.TEXT, allowNull: false, defaultValue: ''
    },
    // [stripe:restaurant] to [bank:restaurant]
    isPaidOut: {
      type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false
    },
    paidOutAt: {
      type: DataTypes.DATE, allowNull: true, defaultValue: null
    },
    paidOutError: {
      type: DataTypes.TEXT, allowNull: false, defaultValue: ''
    },
    payoutId: {
      type: DataTypes.STRING, allowNull: true, defaultValue: null
    },
    isInited: {
      type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false
    },
    initedAt: {
      type: DataTypes.DATE, allowNull: true, defaultValue: null
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
      'id', 'restaurantId', 'amount', 'isTransfered',
      'transferId','transferError','isPaidOut', 
    ];
  }

  Model.getTransferStatuses = function ({asArray=false}={}) {
    return Model._mapDict(TRANSFER_STATUSES, {asArray} );
  };

  return Model;

}
