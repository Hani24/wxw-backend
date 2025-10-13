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
    code: {
      type: DataTypes.STRING, allowNull: false, required: true,
    },
    maxAge: {
      type: DataTypes.INTEGER(11).UNSIGNED, allowNull: true, defaultValue: 0
    },
    isUsed: {
      type: DataTypes.BOOLEAN, allowNull: true, defaultValue: false,
    },
    usedAt: {
      type: DataTypes.DATE, allowNull: true, defaultValue: null,      
    },
    isExpired: {
      type: DataTypes.BOOLEAN, allowNull: true, defaultValue: false,
    },
    expiredAt: {
      type: DataTypes.DATE, allowNull: true, defaultValue: null,      
    },
    isResent: {
      type: DataTypes.BOOLEAN, allowNull: true, defaultValue: false,
    },
    resentAt: {
      type: DataTypes.DATE, allowNull: true, defaultValue: null 
    },
  });

  Model.slowDownRequest = function( mAccessRecovery, minSeconds=60 ){
    // Max 1 req. / min.
    const fromDate = mAccessRecovery.resentAt || mAccessRecovery.createdAt;
    const resentAt = new Date( (fromDate).toString('utf-8') ).getTime();
    return ( resentAt > Date.now() - ( minSeconds *1000 ) );
  }

  return Model;

}
